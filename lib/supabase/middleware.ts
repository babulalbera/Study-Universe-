import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// GATE 1: Ye pages bina login ke nahi khulte. Visitor seedha Login/Signup page par jata hai (login ke baad wapas yahin aata hai).
// Home, About, Contact, Privacy, Terms, Login, Signup khule rehte hain. Koi page khula rakhna ho to use is list se hata do.
const PROTECTED = ["/tasks", "/books", "/courses", "/mock-tests", "/results", "/profile", "/admin"];

// GATE 2 (migration 017): Login ho chuke user ke liye BHI, jab tak Telegram Bind + Channel Join + Referral
// quota pura na ho, poori site lock rehti hai — sirf ye exempt paths khulte hain.
const GATE_EXEMPT = ["/gate", "/login", "/signup", "/api", "/r"];

function isGateExempt(path: string) {
  return GATE_EXEMPT.some((p) => path === p || path.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response; // keys ke bina site phir bhi khule

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie && !isProtected) return response; // anjaan visitor: Supabase call ki zaroorat nahi

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser(); // server se verify hota hai
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  if (user && !isGateExempt(path)) {
    const { data: g } = await supabase.from("profiles").select("role, telegram_id, channel_member").eq("id", user.id).maybeSingle();
    if (g && g.role !== "admin") {
      let unlocked = Boolean(g.telegram_id) && Boolean(g.channel_member);
      if (unlocked) {
        const quota = Number(process.env.REFERRAL_QUOTA ?? "1");
        if (quota > 0) {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("referred_by", user.id)
            .eq("channel_member", true);
          unlocked = (count ?? 0) >= quota;
        }
      }
      if (!unlocked) {
        const url = request.nextUrl.clone();
        url.pathname = "/gate";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

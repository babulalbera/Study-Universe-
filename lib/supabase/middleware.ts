import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

// GATE: Ye pages bina login ke nahi khulte. Visitor seedha Login/Signup page par jata hai (login ke baad wapas yahin aata hai).
// Home, About, Contact, Privacy, Terms, Login, Signup khule rehte hain. Koi page khula rakhna ho to use is list se hata do.
const PROTECTED = ["/tasks", "/books", "/courses", "/mock-tests", "/results", "/profile", "/admin"];

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
  return response;
}

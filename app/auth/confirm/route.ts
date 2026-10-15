import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/profile");

// Email ke Link ka dusra tareeka (token_hash): kisi bhi Browser/Gmail ke andar se kholne par bhi chalta hai.
// Isse chalu karne ke liye Supabase > Authentication > Emails > Templates mein Link ye banao:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirm`);
}

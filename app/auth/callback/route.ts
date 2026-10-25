import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/profile");

// Email ka Link (code wala tareeka) aur Social login (Google...) dono yahin aate hain.
// Password reset ke liye ?next=/reset-password bhi.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  if (searchParams.get("error_code") === "otp_expired") return NextResponse.redirect(`${origin}/login?error=expired`);
  // Social login me user ne cancel kiya ya provider ne mana kiya
  if (searchParams.get("error")) return NextResponse.redirect(`${origin}/login?error=oauth`);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirm`);
}

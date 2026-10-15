import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/profile");

// Email ka Link (code wala tareeka) yahin aata hai. Password reset ke liye ?next=/reset-password bhi.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  if (searchParams.get("error_code") === "otp_expired") return NextResponse.redirect(`${origin}/login?error=expired`);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirm`);
}

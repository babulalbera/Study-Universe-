"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { validateLogin, validateSignup } from "@/lib/validations";
import type { FormState } from "./types";

const NOT_CONFIGURED: FormState = { error: "Supabase abhi set nahi hai. .env.local mein Keys daalo." };
const str = (f: FormData, k: string) => String(f.get(k) ?? "");
// Sirf apni site ka raasta (open-redirect se bachav)

type AuthErr = { code?: string; status?: number; message: string };

// Supabase ki asli wajah ko saaf Hindi/Hinglish mein badalta hai (taaki pata chale kya gadbad hai)
function authMessage(e: AuthErr): string {
  const c = e.code ?? "";
  const m = e.message.toLowerCase();
  if (c === "email_not_confirmed" || m.includes("not confirmed")) return "Email abhi verify nahi hua. Neeche \"Code bhejo\" dabao aur Email ka code daalo.";
  if (c === "invalid_credentials" || m.includes("invalid login")) return "Email ya password galat hai.";
  if (c === "user_already_exists" || m.includes("already registered") || m.includes("already been registered")) return "Is Email se Account pehle se hai. Login karo.";
  if (c === "weak_password") return "Password kamzor hai. Kam se kam 8 akshar rakho.";
  if (c === "signup_disabled") return "Abhi naye Signup band hain.";
  if (c === "email_address_not_authorized" || m.includes("not authorized")) return "Email service abhi sirf Team ke Emails par chalti hai. Admin ko Supabase mein Custom SMTP lagani hogi (ya Confirm Email band karni hogi).";
  if (c === "over_email_send_rate_limit" || c === "over_request_rate_limit" || e.status === 429 || m.includes("rate limit")) return "Bahut jaldi-jaldi koshish ki ya Email ki hadd poori ho gayi. Thodi der baad dobara try karo.";
  if (m.includes("sending") && m.includes("email")) return "Email bhejne mein dikkat aayi. Admin ko Supabase mein Custom SMTP set karni hogi.";
  return `Dikkat aayi: ${e.message}`;
}
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/profile");

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const v = { email: str(formData, "email").trim(), password: str(formData, "password") };
  const fieldErrors = validateLogin(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors: fieldErrors as Record<string, string> };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(v);
  if (error) {
    const notConfirmed = error.code === "email_not_confirmed" || error.message.toLowerCase().includes("not confirmed");
    return { error: authMessage(error), needsConfirm: notConfirmed };
  }
  redirect(safeNext(str(formData, "next")));
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const v = { name: str(formData, "name").trim(), email: str(formData, "email").trim(), password: str(formData, "password") };
  const fieldErrors = validateSignup(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors: fieldErrors as Record<string, string> };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email, password: v.password,
    options: { data: { full_name: v.name }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: authMessage(error) };
  // Email pehle se registered ho to Supabase kabhi-kabhi bina error ke khaali "identities" deta hai
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return { error: "Is Email se Account pehle se hai. Login karo." };
  if (data.session) redirect("/profile");
  return { message: "Account ban gaya! Email par 6 ank ka code bheja hai.", otpEmail: v.email };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}


// Confirm Email dobara bhejo (Login page se)
export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = str(formData, "email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { fieldErrors: { email: "Pehle upar sahi Email likho" } };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  if (error) return { error: authMessage(error) };
  return { message: "Confirm Link dobara bhej diya. Email (aur Spam folder) dekho." };
}

// Password bhool gaye: Email par Reset Link (hamesha ek jaisa jawab, taaki pata na chale kaun-sa Email registered hai)
export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = str(formData, "email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { fieldErrors: { email: "Sahi Email likho" } };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  if (error && (error.code === "over_email_send_rate_limit" || error.status === 429 || error.code === "email_address_not_authorized" || error.message.toLowerCase().includes("sending"))) {
    return { error: authMessage(error) };
  }
  return { message: "Agar ye Email registered hai to Reset Link bhej diya gaya hai. Email (aur Spam folder) dekho." };
}

// Reset Link se aane ke baad naya password
export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const next = str(formData, "next");
  const again = str(formData, "again");
  const fieldErrors: Record<string, string> = {};
  if (next.length < 8) fieldErrors.next = "Password kam se kam 8 akshar ka ho";
  if (again !== next) fieldErrors.again = "Dono password same hone chahiye";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Reset Link purana ya galat hai. Dobara Reset Link mangao." };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: authMessage(error) };
  redirect("/profile");
}

// ===== OAUTH-LOGIN (Google / Facebook / Apple) =====
// Jo providers Supabase me ON hain unki list Vercel env NEXT_PUBLIC_OAUTH_PROVIDERS me rakho (jaise "google" ya "google,facebook").
// Ye server action sirf Supabase se login ka URL banata hai; browser use khol deta hai; wapas /auth/callback aata hai.
export async function oauthLogin(provider: string, nextRaw: string): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED.error };
  const on = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
  if (!["google", "facebook", "apple"].includes(provider) || !on.includes(provider)) return { error: "Ye login abhi chalu nahi hai. Email se Login karo." };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "facebook" | "apple",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(nextRaw))}`,
      skipBrowserRedirect: true,
      queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
    },
  });
  if (error || !data.url) return { error: error ? authMessage(error) : "Login shuru nahi ho paya. Dobara koshish karo." };
  return { url: data.url };
}

// ===== OTP-SIGNUP (Email par 6 ank ka code) =====
// Supabase me "Confirm sign up" Email template me {{ .Token }} hona chahiye (README: Authentication > Emails).
export async function verifySignupOtp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = str(formData, "email").trim();
  const code = str(formData, "code").replace(/\D/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email galat hai. Wapas jaakar dobara Signup karo." };
  if (code.length !== 6) return { error: "6 ank ka poora code likho." };
  const supabase = await createClient();
  let { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
  if (error) {
    const retry = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    error = retry.error;
  }
  if (error) {
    const m = error.message.toLowerCase();
    if (error.code === "otp_expired" || m.includes("expired") || m.includes("invalid")) return { error: "Code galat ya purana ho gaya. Sahi code likho ya naya code mangao." };
    return { error: authMessage(error) };
  }
  redirect(safeNext(str(formData, "next")));
}

// Naya code bhejo (signup ke baad ya Login page se)
export async function resendSignupCode(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = str(formData, "email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { fieldErrors: { email: "Pehle upar sahi Email likho" } };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  if (error) return { error: authMessage(error) };
  return { message: "Naya code bhej diya. Email (aur Spam folder) dekho.", otpEmail: email };
}

// ===== OTP-RESET (Signup + Password reset dono: Email par 6 ank ka code) =====
// Supabase me "Confirm sign up" aur "Reset password" dono Email template me {{ .Token }} hona chahiye.
export async function verifyEmailOtp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const kind = str(formData, "kind") === "recovery" ? "recovery" : "signup";
  const email = str(formData, "email").trim();
  const code = str(formData, "code").replace(/\D/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email galat hai. Wapas jaakar dobara try karo." };
  if (code.length !== 6) return { error: "6 ank ka poora code likho." };
  const supabase = await createClient();
  let { error } = await supabase.auth.verifyOtp({ email, token: code, type: kind });
  if (error && kind === "signup") {
    const retry = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    error = retry.error;
  }
  if (error) {
    const m = error.message.toLowerCase();
    if (error.code === "otp_expired" || m.includes("expired") || m.includes("invalid")) return { error: "Code galat ya purana ho gaya. Sahi code likho ya naya code mangao." };
    return { error: authMessage(error) };
  }
  redirect(kind === "recovery" ? "/reset-password" : safeNext(str(formData, "next")));
}

// Code bhejo / dobara bhejo (kind = "signup" ya "recovery")
export async function resendEmailCode(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const kind = str(formData, "kind") === "recovery" ? "recovery" : "signup";
  const email = str(formData, "email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { fieldErrors: { email: "Sahi Email likho" } };
  const supabase = await createClient();
  if (kind === "recovery") {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: authMessage(error) };
    return { message: "Reset code bhej diya. Email (aur Spam folder) dekho.", otpEmail: email };
  }
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  if (error) return { error: authMessage(error) };
  return { message: "Naya code bhej diya. Email (aur Spam folder) dekho.", otpEmail: email };
}

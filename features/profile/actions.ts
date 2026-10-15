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
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/profile");

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const v = { email: str(formData, "email").trim(), password: str(formData, "password") };
  const fieldErrors = validateLogin(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors: fieldErrors as Record<string, string> };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(v);
  if (error) return { error: "Email ya password galat hai (ya email abhi confirm nahi hua)." };
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
  if (error) return { error: error.message.includes("registered") ? "Is email se Account pehle se hai." : "Signup nahi ho paya. Dobara koshish karo." };
  if (data.session) redirect("/profile");
  return { message: "Account ban gaya! Apna email kholo aur confirm link par click karo." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}


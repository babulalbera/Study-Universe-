"use server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { FormState } from "../types";

// Profile page ka "Link Code banao" button isko call karta hai.
// Code 10 minute ke liye valid hota hai; Telegram bot isko /start <code> se padhega.
export async function generateLinkCode(_prev: FormState, _formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Pehle Login karo." };

  const code = Math.random().toString(36).slice(2, 8).padEnd(6, "0").toUpperCase();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minute

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ link_code: code, link_code_expires_at: expires }).eq("id", user.id);
  if (error) return { error: "Code nahi ban paya, dobara try karo." };

  return { code, message: "Code ban gaya! Niche wala button dabao." };
}

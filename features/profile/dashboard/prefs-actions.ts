"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { FormState } from "../types";

const DEFAULT_NOTIFY = { new_content: true, daily_reminder: false, goal_reminder: false };

export type PrefResult = { ok: boolean; error?: string };

// "Naye content ki suchna" ON/OFF (baaki 2 pasand ko nahi chhedta)
export async function setNewContentNotif(on: boolean): Promise<PrefResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Login karo" };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("notify_prefs").eq("id", user.id).maybeSingle();
  const cur = ((data as { notify_prefs?: Record<string, unknown> } | null)?.notify_prefs ?? {}) as Record<string, unknown>;
  const next = { ...DEFAULT_NOTIFY, ...cur, new_content: Boolean(on) };
  const { error } = await supabase.from("profiles").update({ notify_prefs: next }).eq("id", user.id);
  if (error) return { ok: false, error: "Save nahi hua" };
  revalidatePath("/profile");
  return { ok: true };
}

// Bhasha: sirf "hi" ya "en"
export async function setLanguage(lang: string): Promise<PrefResult> {
  if (lang !== "hi" && lang !== "en") return { ok: false, error: "Galat bhasha" };
  const user = await getUser();
  if (!user) return { ok: false, error: "Login karo" };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("ui_prefs").eq("id", user.id).maybeSingle();
  const raw = (data as { ui_prefs?: unknown } | null)?.ui_prefs;
  const cur = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const { error } = await supabase.from("profiles").update({ ui_prefs: { ...cur, lang } }).eq("id", user.id);
  if (error) return { ok: false, error: "Save nahi hua" };
  revalidatePath("/profile");
  return { ok: true };
}

// Profile card ki chhoti line (bio), 120 akshar tak
export async function saveBio(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Pehle Login karo." };
  const bio = String(f.get("bio") ?? "").replace(/\s+/g, " ").trim();
  if (bio.length > 120) return { fieldErrors: { bio: "Zyada se zyada 120 akshar" } };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ bio: bio || null }).eq("id", user.id);
  if (error) return { error: "Save nahi ho paya. Dobara koshish karo." };
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { message: bio ? "Bio save ho gayi ✓" : "Bio hata di, default line dikhegi ✓" };
}

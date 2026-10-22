"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { isLang } from "@/lib/i18n";
import type { FormState } from "../types";

const LOGIN = "Pehle Login karo.";

// ---------- Bio (profile card ki chhoti line) ----------
export async function saveBio(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: LOGIN };
  const bio = String(f.get("bio") ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (bio.length > 120) return { fieldErrors: { bio: "Bio 120 akshar tak ki ho" } };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ bio: bio || null }).eq("id", user.id);
  if (error) return { error: "Save nahi ho paya. Dobara koshish karo." };
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { message: bio ? "Bio save ho gayi ✓" : "Bio hata di ✓" };
}

// ---------- Bhasha (English / हिन्दी) ----------
export async function setLanguage(lang: string): Promise<{ ok: boolean; error?: string }> {
  if (!isLang(lang)) return { ok: false, error: "Galat bhasha" };
  const user = await getUser();
  if (!user) return { ok: false, error: LOGIN };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("ui_prefs").eq("id", user.id).maybeSingle();
  const cur = ((data as { ui_prefs: Record<string, unknown> | null } | null)?.ui_prefs ?? {}) as Record<string, unknown>;
  const next: Record<string, string> = {};
  if (typeof cur.theme === "string" && cur.theme.length <= 20) next.theme = cur.theme;
  next.lang = lang;
  const { error } = await supabase.from("profiles").update({ ui_prefs: next }).eq("id", user.id);
  if (error) return { ok: false, error: "Save nahi hua" };
  revalidatePath("/profile");
  return { ok: true };
}

// ---------- Notifications ON/OFF (naye content ki soochna). Baaki pasand jaisi thi waisi hi rehti hai ----------
export async function setNotifications(on: boolean): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: LOGIN };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("notify_prefs").eq("id", user.id).maybeSingle();
  const cur = ((data as { notify_prefs: Record<string, unknown> | null } | null)?.notify_prefs ?? {}) as Record<string, unknown>;
  const keep = (k: string, d: boolean) => (typeof cur[k] === "boolean" ? (cur[k] as boolean) : d);
  const next = { new_content: Boolean(on), daily_reminder: keep("daily_reminder", false), goal_reminder: keep("goal_reminder", false) };
  const { error } = await supabase.from("profiles").update({ notify_prefs: next }).eq("id", user.id);
  if (error) return { ok: false, error: "Save nahi hua" };
  revalidatePath("/profile");
  return { ok: true };
}

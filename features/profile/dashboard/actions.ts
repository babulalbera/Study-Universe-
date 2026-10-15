"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, getUser } from "@/lib/auth";
import { EXAMS, PERIODS, METRICS, SUBJECTS, UUID_RE } from "@/lib/profile-options";
import type { FormState } from "../types";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const LOGIN: FormState = { error: "Pehle Login karo." };
const bust = () => revalidatePath("/profile");

// ---------- Profile details ----------
export async function updateDetails(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return LOGIN;
  const fe: Record<string, string> = {};
  const name = s(f, "full_name");
  if (name.length < 2 || name.length > 60) fe.full_name = "Naam 2 se 60 akshar ka ho";
  const phone = s(f, "phone");
  if (phone && !/^[0-9+() -]{7,20}$/.test(phone)) fe.phone = "Sahi mobile number likho (7-20 ank)";
  const exam = s(f, "target_exam");
  if (exam && !(EXAMS as readonly string[]).includes(exam)) fe.target_exam = "Suchi mein se chuno";
  const examDate = s(f, "exam_date");
  if (examDate && (!/^\d{4}-\d{2}-\d{2}$/.test(examDate) || Number.isNaN(Date.parse(examDate)) || examDate < "2000-01-01" || examDate > "2100-12-31")) fe.exam_date = "Sahi tareekh chuno";
  const goal = Number(s(f, "daily_goal_minutes"));
  if (!Number.isInteger(goal) || goal < 15 || goal > 1440) fe.daily_goal_minutes = "15 se 1440 minute ke beech";
  const subjects = f.getAll("subjects").map(String).filter((x) => (SUBJECTS as readonly string[]).includes(x));
  if (Object.keys(fe).length) return { fieldErrors: fe };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    full_name: name, phone: phone || null, target_exam: exam || null, exam_date: examDate || null,
    favorite_subjects: Array.from(new Set(subjects)), daily_goal_minutes: goal,
  }).eq("id", user.id);
  if (error) return { error: "Save nahi ho paya. Dobara koshish karo." };
  bust();
  return { message: "Profile save ho gayi ✓" };
}

// ---------- Profile photo (file browser se seedha Storage mein jati hai; yahan sirf path save hota hai) ----------
export async function setAvatar(path: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Login karo" };
  if (!new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(jpg|png|webp)$`, "i").test(path)) return { error: "File ka path galat hai" };
  const supabase = await createClient();
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) return { error: "Photo save nahi hui" };
  const prev = (old as { avatar_path: string | null } | null)?.avatar_path;
  if (prev && prev !== path) await supabase.storage.from("avatars").remove([prev]);
  bust();
  return {};
}
export async function removeAvatar(): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Login karo" };
  const supabase = await createClient();
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const prev = (old as { avatar_path: string | null } | null)?.avatar_path;
  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
  if (error) return { error: "Photo hata nahi payi" };
  if (prev) await supabase.storage.from("avatars").remove([prev]);
  bust();
  return {};
}

// ---------- Goals ----------
export async function saveGoal(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return LOGIN;
  const id = s(f, "id");
  const title = s(f, "title");
  const period = s(f, "period");
  const metric = s(f, "metric");
  const target = Number(s(f, "target"));
  if (title.length < 1 || title.length > 80) return { error: "Goal ka naam 1 se 80 akshar ka ho" };
  if (!(period in PERIODS) || !(metric in METRICS)) return { error: "Period ya Prakar galat hai" };
  if (!Number.isInteger(target) || target < 1 || target > 100000) return { error: "Target 1 se 100000 ke beech ek poora ank ho" };
  const supabase = await createClient();
  if (id) {
    if (!UUID_RE.test(id)) return { error: "Goal nahi mila" };
    const { error } = await supabase.from("user_goals").update({ title, period, metric, target }).eq("id", id);
    if (error) return { error: "Save nahi hua" };
  } else {
    const { count } = await supabase.from("user_goals").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= 20) return { error: "Zyada se zyada 20 Goals ban sakte hain" };
    const { error } = await supabase.from("user_goals").insert({ user_id: user.id, title, period, metric, target });
    if (error) return { error: "Save nahi hua" };
  }
  bust();
  return { message: "Goal save ho gaya ✓" };
}
export async function deleteGoal(f: FormData) {
  const user = await getUser();
  const id = s(f, "id");
  if (!user || !UUID_RE.test(id)) return;
  const supabase = await createClient();
  await supabase.from("user_goals").delete().eq("id", id);
  bust();
}
export async function toggleGoal(f: FormData) {
  const user = await getUser();
  const id = s(f, "id");
  if (!user || !UUID_RE.test(id)) return;
  const supabase = await createClient();
  await supabase.from("user_goals").update({ is_active: s(f, "active") === "1" }).eq("id", id);
  bust();
}

// ---------- Notifications ----------
export async function markRead(f: FormData) {
  const user = await getUser();
  const id = s(f, "id");
  if (!user || !UUID_RE.test(id)) return;
  const supabase = await createClient();
  if (s(f, "unread") === "1") await supabase.from("notification_reads").delete().eq("notification_id", id).eq("user_id", user.id);
  else await supabase.from("notification_reads").upsert({ user_id: user.id, notification_id: id });
  bust();
}
export async function markAllRead() {
  const user = await getUser();
  if (!user) return;
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id").order("created_at", { ascending: false }).limit(40);
  const rows = ((data ?? []) as { id: string }[]).map((x) => ({ user_id: user.id, notification_id: x.id }));
  if (rows.length) await supabase.from("notification_reads").upsert(rows);
  bust();
}
export async function saveNotifPrefs(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return LOGIN;
  const prefs = { new_content: f.get("new_content") === "on", daily_reminder: f.get("daily_reminder") === "on", goal_reminder: f.get("goal_reminder") === "on" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ notify_prefs: prefs }).eq("id", user.id);
  if (error) return { error: "Save nahi hua" };
  bust();
  return { message: "Pasand save ho gayi ✓" };
}

// ---------- Bookmarks ----------
export async function toggleBookmark(bookId: string): Promise<{ ok: boolean; saved?: boolean }> {
  const user = await getUser();
  if (!user || !UUID_RE.test(bookId)) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("item_type", "book").eq("item_id", bookId).maybeSingle();
  if (data) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", (data as { id: string }).id);
    if (error) return { ok: false };
  } else {
    const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, item_type: "book", item_id: bookId });
    if (error) return { ok: false };
  }
  revalidatePath("/books");
  bust();
  return { ok: true, saved: !data };
}

// ---------- Account ----------
export async function changePassword(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user || !user.email) return LOGIN;
  const current = String(f.get("current") ?? "");
  const next = String(f.get("next") ?? "");
  const again = String(f.get("again") ?? "");
  if (next.length < 8) return { fieldErrors: { next: "Naya password kam se kam 8 akshar ka ho" } };
  if (next !== again) return { fieldErrors: { again: "Dono password same hone chahiye" } };
  if (next === current) return { fieldErrors: { next: "Naya password purane se alag ho" } };
  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (check.error) return { fieldErrors: { current: "Abhi ka password galat hai" } };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Password nahi badla. Kuch der baad dobara koshish karo." };
  return { message: "Password badal gaya ✓" };
}

export async function requestPasswordReset(): Promise<FormState> {
  const user = await getUser();
  if (!user?.email) return LOGIN;
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${origin}/auth/callback` });
  if (error) return { error: "Email nahi ja paya. Supabase ki Email setting dekho." };
  return { message: "Reset ka Link tumhare Email par bhej diya gaya." };
}

export async function changeEmail(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return LOGIN;
  const email = s(f, "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { fieldErrors: { email: "Sahi email likho" } };
  if (email === user.email) return { fieldErrors: { email: "Ye wahi email hai" } };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${origin}/auth/callback` });
  if (error) return { error: "Email nahi badla. Dobara koshish karo." };
  return { message: "Confirm karne ka Link bheja gaya. Link dabane ke baad hi Email badlega." };
}

export async function logoutAll() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}

export async function deleteAccount(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user || !user.email) return LOGIN;
  if (s(f, "confirm") !== "DELETE") return { fieldErrors: { confirm: "Confirm ke liye DELETE (bade akshar) likho" } };
  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: user.email, password: String(f.get("password") ?? "") });
  if (check.error) return { fieldErrors: { password: "Password galat hai" } };

  let admin;
  try { admin = createAdminClient(); } catch { return { error: "Server par Delete ki suvidha chalu nahi hai (SUPABASE_SERVICE_ROLE_KEY chahiye)." }; }

  const profile = await getProfile();
  if (profile?.role === "admin") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) <= 1) return { error: "Tum aakhri Admin ho. Pehle kisi aur ko Admin banao, phir Account hatao." };
  }
  const files = await admin.storage.from("avatars").list(user.id);
  if (files.data?.length) await admin.storage.from("avatars").remove(files.data.map((x) => `${user.id}/${x.name}`));
  // profiles se jude sab records (tasks, tests, goals, bookmarks...) apne aap hat jate hain (ON DELETE CASCADE)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Account hata nahi paya. Dobara koshish karo." };
  try { await supabase.auth.signOut(); } catch { /* user pehle hi hat chuka */ }
  redirect("/");
}

// ---------- Report a problem ----------
export async function submitReport(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return LOGIN;
  const category = s(f, "category");
  const message = s(f, "message");
  if (!["bug", "content", "account", "other"].includes(category)) return { fieldErrors: { category: "Prakar chuno" } };
  if (message.length < 10 || message.length > 2000) return { fieldErrors: { message: "Message 10 se 2000 akshar ka ho" } };
  const supabase = await createClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase.from("support_reports").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= 5) return { error: "Aaj ke liye 5 Reports ho chuki hain. Kal dobara bhejo." };
  const { error } = await supabase.from("support_reports").insert({ user_id: user.id, category, message });
  if (error) return { error: "Report nahi ja payi. Dobara koshish karo." };
  return { message: "Report mil gayi. Dhanyawaad ✓" };
}

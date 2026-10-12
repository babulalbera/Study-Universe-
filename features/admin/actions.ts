"use server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// ---- chhote helper (export nahi hote) ----
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => { const v = Number(s(f, k)); return Number.isFinite(v) ? Math.trunc(v) : 0; };
const on = (f: FormData, k: string) => f.get(k) === "on";
const COLOR = /^#[0-9a-fA-F]{6}$/;
const okHref = (h: string) => h === "" || (h.startsWith("/") && !h.startsWith("//")) || /^https?:\/\//.test(h);
const color = (v: string, d: string) => (COLOR.test(v) ? v : d);

function back(path: string, kind: "ok" | "error", msg: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);
}

// Har action: pehle server par admin ki jaanch. (Database ki RLS bhi alag se rokti hai.)
async function ctx() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  return { profile, supabase };
}
async function audit(c: Awaited<ReturnType<typeof ctx>>, action: string, table: string, id: string | null, details: Record<string, unknown> = {}) {
  await c.supabase.from("audit_logs").insert({ actor_id: c.profile.id, action, table_name: table, record_id: id, details });
}
const done = (publicPaths: string[]) => { publicPaths.forEach((p) => revalidatePath(p)); revalidateTag("home"); };

// ================= Home Cards =================
export async function saveCard(formData: FormData) {
  const P = "/admin/home";
  const c = await ctx();
  const id = s(formData, "id");
  const title = s(formData, "title");
  const href = s(formData, "href");
  if (title.length < 2) back(P, "error", "Title kam se kam 2 akshar ka ho");
  if (!okHref(href)) back(P, "error", "Link / se ya https:// se shuru hona chahiye");
  const row = {
    title, href: href || null, description: s(formData, "description"),
    color: color(s(formData, "color"), "#D4AF37"), bg1: color(s(formData, "bg1"), "#1E293B"), bg2: color(s(formData, "bg2"), "#0F172A"),
    icon_url: `/images/tools/${s(formData, "icon") || "free"}.webp`, sort_order: num(formData, "sort_order"), is_visible: on(formData, "is_visible"),
  };
  const q = id
    ? c.supabase.from("feature_cards").update(row).eq("id", id)
    : c.supabase.from("feature_cards").insert({ ...row, key: `c-${Date.now().toString(36)}` });
  const { error } = await q;
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "feature_cards", id || null, { title });
  done(["/", P]);
  back(P, "ok", "Card save ho gaya ✓");
}
export async function toggleCard(formData: FormData) {
  const P = "/admin/home";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("feature_cards").update({ is_visible: s(formData, "visible") === "1" }).eq("id", id);
  if (error) back(P, "error", "Badal nahi paya");
  await audit(c, "toggle", "feature_cards", id);
  done(["/", P]);
  back(P, "ok", "Card ki Visibility badal gayi ✓");
}
export async function deleteCard(formData: FormData) {
  const P = "/admin/home";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("feature_cards").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "feature_cards", id);
  done(["/", P]);
  back(P, "ok", "Card hata diya ✓");
}

// ================= Social Links =================
export async function saveSocial(formData: FormData) {
  const P = "/admin/home";
  const c = await ctx();
  const id = s(formData, "id");
  const href = s(formData, "href");
  if (!/^https?:\/\//.test(href) && href !== "") back(P, "error", "Social link https:// se shuru hona chahiye");
  const { error } = await c.supabase.from("social_links")
    .update({ href: href || null, subtitle: s(formData, "subtitle"), is_visible: on(formData, "is_visible") }).eq("id", id);
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, "update", "social_links", id);
  done(["/", P]);
  back(P, "ok", "Social link save ho gaya ✓");
}

// ================= Announcements =================
export async function saveAnnouncement(formData: FormData) {
  const P = "/admin/announcements";
  const c = await ctx();
  const id = s(formData, "id");
  const title = s(formData, "title");
  if (title.length < 3) back(P, "error", "Title kam se kam 3 akshar ka ho");
  const row = { title, body: s(formData, "body"), is_active: on(formData, "is_active") };
  const { error } = id
    ? await c.supabase.from("announcements").update(row).eq("id", id)
    : await c.supabase.from("announcements").insert({ ...row, created_by: c.profile.id });
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "announcements", id || null, { title });
  done(["/", P]);
  back(P, "ok", "Notice save ho gaya ✓");
}
export async function deleteAnnouncement(formData: FormData) {
  const P = "/admin/announcements";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("announcements").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "announcements", id);
  done(["/", P]);
  back(P, "ok", "Notice hata diya ✓");
}

// ================= Tasks =================
export async function saveTask(formData: FormData) {
  const P = "/admin/tasks";
  const c = await ctx();
  const id = s(formData, "id");
  const title = s(formData, "title");
  if (title.length < 3) back(P, "error", "Title kam se kam 3 akshar ka ho");
  const row = {
    title, subject: s(formData, "subject"), note: s(formData, "note"),
    due_date: s(formData, "due_date") || null, sort_order: num(formData, "sort_order"), is_active: on(formData, "is_active"),
  };
  const { error } = id
    ? await c.supabase.from("tasks").update(row).eq("id", id)
    : await c.supabase.from("tasks").insert({ ...row, created_by: c.profile.id });
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "tasks", id || null, { title });
  done(["/tasks", P]);
  back(P, "ok", "Task save ho gaya ✓");
}
export async function deleteTask(formData: FormData) {
  const P = "/admin/tasks";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("tasks").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "tasks", id);
  done(["/tasks", P]);
  back(P, "ok", "Task hata diya ✓");
}

// ================= Users =================
export async function setRole(formData: FormData) {
  const P = "/admin/users";
  const c = await ctx();
  const id = s(formData, "id");
  const role = s(formData, "role");
  if (role !== "student" && role !== "admin") back(P, "error", "Role galat hai");
  if (id === c.profile.id) back(P, "error", "Apna khud ka role yahan se nahi badal sakte");
  const { error } = await c.supabase.from("profiles").update({ role }).eq("id", id);
  if (error) back(P, "error", `Role nahi badla: ${error.message}`);
  await audit(c, "set_role", "profiles", id, { role });
  done([P]);
  back(P, "ok", "Role badal gaya ✓");
}

// ================= Settings =================
export async function saveSettings(formData: FormData) {
  const P = "/admin/settings";
  const c = await ctx();
  const email = s(formData, "contact_email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back(P, "error", "Sahi email likho");
  const course = s(formData, "course_url");
  if (!okHref(course)) back(P, "error", "Course Link / se ya https:// se shuru hona chahiye");
  const value = { name: s(formData, "name"), tagline: s(formData, "tagline"), contact_email: email, course_url: course };
  const { error } = await c.supabase.from("site_settings").upsert({ key: "site", value });
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, "update", "site_settings", "site", value);
  done(["/contact", "/", P]);
  back(P, "ok", "Settings save ho gayi ✓");
}

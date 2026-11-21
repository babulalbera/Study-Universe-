"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { COVER_BUCKET, isCoverPath } from "@/lib/book-meta";
import { PLATFORMS } from "@/features/platforms/data";

const P = "/admin/platforms";
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => { const v = Number(s(f, k)); return Number.isFinite(v) ? Math.trunc(v) : 0; };
const on = (f: FormData, k: string) => f.get(k) === "on";
const COLOR = /^#[0-9a-fA-F]{6}$/;
const okUrl = (u: string) => /^https?:\/\/\S+$/.test(u);
const hostOf = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const slugify = (n: string) => n.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

// open = jis platform par kaam ho raha hai, wo wapas khula rahe
function go(kind: "ok" | "error", msg: string, open?: string): never {
  redirect(`${P}?${open ? `open=${encodeURIComponent(open)}&` : ""}${kind}=${encodeURIComponent(msg)}`);
}
async function ctx() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  return { profile, supabase };
}
type Ctx = Awaited<ReturnType<typeof ctx>>;
async function audit(c: Ctx, action: string, table: string, id: string | null, details: Record<string, unknown> = {}) {
  await c.supabase.from("audit_logs").insert({ actor_id: c.profile.id, action, table_name: table, record_id: id, details });
}
const bust = () => { revalidatePath("/free-course"); revalidatePath(P); };
async function nextOrder(c: Ctx, platformId: string) {
  const { data } = await c.supabase.from("free_platform_links").select("sort_order").eq("platform_id", platformId).order("sort_order", { ascending: false }).limit(1);
  return ((data?.[0] as { sort_order: number } | undefined)?.sort_order ?? 0) + 10;
}

// ================= Platform =================
export async function savePlatform(formData: FormData) {
  const c = await ctx();
  const id = s(formData, "id");
  const name = s(formData, "name");
  const logoUrl = s(formData, "logo_url");
  if (name.length < 2) go("error", "Platform ka naam kam se kam 2 akshar ka ho", id);
  if (logoUrl && !okUrl(logoUrl)) go("error", "Logo link https:// se shuru hona chahiye", id);
  const col = s(formData, "color");
  const row = {
    name: name.slice(0, 60), description: s(formData, "description").slice(0, 200), color: COLOR.test(col) ? col : "#D4AF37",
    logo_url: logoUrl || null, sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published"),
  };
  if (id) {
    const { error } = await c.supabase.from("free_platforms").update(row).eq("id", id);
    if (error) go("error", `Save nahi hua: ${error.message}`, id);
    await audit(c, "update", "free_platforms", id, { name });
    bust();
    go("ok", "Platform save ho gaya ✓", id);
  }
  // naya platform: unique slug (isi se #pw jaisa link banta hai)
  const base = slugify(name) || `p-${Date.now().toString(36)}`;
  const { data: taken } = await c.supabase.from("free_platforms").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r: { slug: string }) => r.slug));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
  const { data, error } = await c.supabase.from("free_platforms").insert({ ...row, slug }).select("id").single();
  if (error || !data) go("error", `Save nahi hua: ${error?.message ?? ""}`);
  await audit(c, "create", "free_platforms", data.id, { name });
  bust();
  go("ok", "Naya platform ban gaya. Ab neeche logo aur links jodo ✓", data.id);
}

export async function deletePlatform(formData: FormData) {
  const c = await ctx();
  const id = s(formData, "id");
  const { data: old } = await c.supabase.from("free_platforms").select("logo_path").eq("id", id).maybeSingle();
  const { error } = await c.supabase.from("free_platforms").delete().eq("id", id);
  if (error) go("error", "Hata nahi paya");
  const lp = (old as { logo_path: string | null } | null)?.logo_path;
  if (lp && isCoverPath(lp)) await c.supabase.storage.from(COVER_BUCKET).remove([lp]);
  await audit(c, "delete", "free_platforms", id);
  bust();
  go("ok", "Platform (links ke saath) hata diya ✓");
}

// Browser se logo upload ke baad bulaya jata hai (BookCoverEditor jaisa). path = null => logo hatao
export async function setPlatformLogo(id: string, path: string | null): Promise<{ error?: string }> {
  const c = await ctx();
  if (path !== null && !isCoverPath(path)) return { error: "Logo ka path galat hai" };
  const { data: old } = await c.supabase.from("free_platforms").select("logo_path").eq("id", id).maybeSingle();
  const { error } = await c.supabase.from("free_platforms").update({ logo_path: path }).eq("id", id);
  if (error) return { error: `Save nahi hua: ${error.message}` };
  const prev = (old as { logo_path: string | null } | null)?.logo_path;
  if (prev && prev !== path && isCoverPath(prev)) await c.supabase.storage.from(COVER_BUCKET).remove([prev]);
  await audit(c, "update", "free_platforms", id, { logo: path ? "set" : "removed" });
  bust();
  return {};
}

// ================= Links =================
export async function saveLink(formData: FormData) {
  const c = await ctx();
  const id = s(formData, "id");
  const pid = s(formData, "platform_id");
  const title = s(formData, "title");
  const url = s(formData, "url");
  if (!title) go("error", "Link ka title likho", pid);
  if (!okUrl(url)) go("error", "Link http:// ya https:// se shuru hona chahiye", pid);
  const row = { title: title.slice(0, 160), url };
  const { error } = id
    ? await c.supabase.from("free_platform_links").update({ ...row, sort_order: num(formData, "sort_order") }).eq("id", id)
    : await c.supabase.from("free_platform_links").insert({ ...row, platform_id: pid, sort_order: await nextOrder(c, pid) });
  if (error) go("error", `Save nahi hua: ${error.message}`, pid);
  await audit(c, id ? "update" : "create", "free_platform_links", id || null, { title });
  bust();
  go("ok", id ? "Link save ho gaya ✓" : "Link jud gaya ✓", pid);
}

export async function deleteLink(formData: FormData) {
  const c = await ctx();
  const id = s(formData, "id");
  const pid = s(formData, "platform_id");
  const { error } = await c.supabase.from("free_platform_links").delete().eq("id", id);
  if (error) go("error", "Hata nahi paya", pid);
  await audit(c, "delete", "free_platform_links", id);
  bust();
  go("ok", "Link hata diya ✓", pid);
}

// Ek saath bahut saari links: har line me  Title | https://link   (ya sirf https://link)
export async function bulkAddLinks(formData: FormData) {
  const c = await ctx();
  const pid = s(formData, "platform_id");
  const lines = s(formData, "lines").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  let order = await nextOrder(c, pid);
  const rows: { platform_id: string; title: string; url: string; sort_order: number }[] = [];
  let skipped = 0;
  for (const ln of lines) {
    const m = ln.match(/^(.*?)(https?:\/\/\S+)$/);
    if (!m) { skipped++; continue; }
    const title = m[1].replace(/[\s|,:;-]+$/, "").trim() || hostOf(m[2]);
    rows.push({ platform_id: pid, title: title.slice(0, 160), url: m[2], sort_order: order }); order += 10;
  }
  if (!rows.length) go("error", "Koi sahi line nahi mili. Format:  Title | https://link", pid);
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await c.supabase.from("free_platform_links").insert(rows.slice(i, i + 200));
    if (error) go("error", `Links nahi judi: ${error.message}`, pid);
  }
  await audit(c, "bulk_create", "free_platform_links", null, { platform_id: pid, count: rows.length });
  bust();
  go("ok", `${rows.length} links jud gayi${skipped ? ` (${skipped} line chhodi, link nahi mila)` : ""} ✓`, pid);
}

// ================= Purani default list ek baar import =================
export async function importDefaultPlatforms() {
  const c = await ctx();
  const { count } = await c.supabase.from("free_platforms").select("id", { count: "exact", head: true });
  if (count) go("error", "Platforms pehle se hain, import ki zaroorat nahi");
  const { data, error } = await c.supabase.from("free_platforms").insert(
    PLATFORMS.map((p, i) => ({
      slug: p.id, name: p.name, description: p.desc.slice(0, 200), color: p.color,
      logo_url: p.logo && okUrl(p.logo) ? p.logo : null, sort_order: i * 10,
    })),
  ).select("id,slug");
  if (error || !data) go("error", `Import nahi hua: ${error?.message ?? ""}. Pehle migration 020 chalayi?`);
  const idOf = new Map((data as { id: string; slug: string }[]).map((r): [string, string] => [r.slug, r.id]));
  const links = PLATFORMS.flatMap((p) =>
    p.links.map((l, i) => ({ platform_id: idOf.get(p.id) ?? "", title: l.title.slice(0, 160), url: l.url, sort_order: i * 10 })),
  ).filter((l) => l.platform_id && okUrl(l.url));
  for (let i = 0; i < links.length; i += 200) {
    const { error: e2 } = await c.supabase.from("free_platform_links").insert(links.slice(i, i + 200));
    if (e2) {
      await c.supabase.from("free_platforms").delete().in("id", Array.from(idOf.values())); // adhoora import saaf
      go("error", `Links import nahi hui: ${e2.message}`);
    }
  }
  await c.supabase.from("site_settings").upsert({ key: "free_platforms", value: { seeded: true } });
  await audit(c, "import", "free_platforms", null, { platforms: data.length, links: links.length });
  bust();
  go("ok", `${data.length} platforms aur ${links.length} links import ho gaye ✓`);
}

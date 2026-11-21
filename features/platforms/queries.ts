import "server-only";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/book-meta";
import { PLATFORMS, type Platform } from "./data";

type LinkRow = { title: string; url: string; sort_order: number; created_at: string };
type Row = {
  slug: string; name: string; description: string; color: string;
  logo_path: string | null; logo_url: string | null; free_platform_links: LinkRow[] | null;
};

// Free Course page ka data. Database se aata hai (admin panel se badalta hai).
// Table abhi bani nahi ya import nahi hua to purani default list (data.ts) dikhti hai, page kabhi khaali nahi rehta.
export async function getPlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const [pr, flag] = await Promise.all([
    supabase
      .from("free_platforms")
      .select("slug,name,description,color,logo_path,logo_url,free_platform_links(title,url,sort_order,created_at)")
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at"),
    supabase.from("site_settings").select("value").eq("key", "free_platforms").maybeSingle(),
  ]);
  const rows = (pr.data ?? []) as Row[];
  const seeded = !!(flag.data?.value as { seeded?: boolean } | null)?.seeded;
  if (pr.error || (rows.length === 0 && !seeded)) return PLATFORMS;
  return rows.map((r) => ({
    id: r.slug,
    name: r.name,
    desc: r.description,
    color: r.color,
    logo: coverUrl(r.logo_path) ?? r.logo_url ?? undefined,
    links: [...(r.free_platform_links ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
      .map((l) => ({ title: l.title, url: l.url })),
  }));
}

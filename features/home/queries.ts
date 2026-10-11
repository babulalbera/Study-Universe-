import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FeatureCardRow, SiteSettings, SocialLinkRow } from "@/types/database";
import { DEFAULT_FEATURE_CARDS, DEFAULT_SOCIAL_LINKS, type FeatureCardData, type SocialLinkData } from "./data";

const FALLBACK_ICON = "/images/tools/free.webp";

// Database se aata hai (sirf dikhne wale, RLS se). Error aaye to purana default dikhta hai.
export async function getHomeCards(): Promise<FeatureCardData[]> {
  if (!isSupabaseConfigured()) return DEFAULT_FEATURE_CARDS;
  const supabase = await createClient();
  const { data, error } = await supabase.from("feature_cards").select("*").eq("is_visible", true).order("sort_order");
  if (error) return DEFAULT_FEATURE_CARDS;
  return (data as FeatureCardRow[]).map((c) => ({
    key: c.key, title: c.title, description: c.description, href: c.href || null,
    color: c.color, bg1: c.bg1, bg2: c.bg2, icon: c.icon_url || FALLBACK_ICON,
  }));
}

export async function getHomeSocials(): Promise<SocialLinkData[]> {
  if (!isSupabaseConfigured()) return DEFAULT_SOCIAL_LINKS;
  const supabase = await createClient();
  const { data, error } = await supabase.from("social_links").select("*").eq("is_visible", true).order("sort_order");
  if (error) return DEFAULT_SOCIAL_LINKS;
  return (data as SocialLinkRow[]).map((s) => ({
    key: s.key, name: s.name, action: s.action_label, subtitle: s.subtitle, href: s.href || null,
    color: s.color, glow: s.glow, border: s.border, bg1: s.bg1, bg2: s.bg2, accent: s.color, icon: s.icon_url || FALLBACK_ICON,
  }));
}

export async function getActiveAnnouncements(): Promise<{ id: string; text: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("id,title,body").order("created_at", { ascending: false }).limit(3);
  return ((data ?? []) as { id: string; title: string; body: string }[]).map((a) => ({ id: a.id, text: a.body ? `${a.title} — ${a.body}` : a.title }));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "site").maybeSingle();
  return ((data as { value: SiteSettings } | null)?.value) ?? {};
}

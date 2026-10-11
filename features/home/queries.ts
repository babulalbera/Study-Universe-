import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FeatureCardRow, SiteSettings, SocialLinkRow } from "@/types/database";
import { DEFAULT_FEATURE_CARDS, DEFAULT_SOCIAL_LINKS, type FeatureCardData, type SocialLinkData } from "./data";

const FALLBACK_ICON = "/images/tools/free.webp";
const CACHE = { revalidate: 60, tags: ["home"] }; // 60 second cache; Admin save par turant naya

const loadCards = unstable_cache(async () => {
  const { data, error } = await createPublicClient().from("feature_cards").select("*").eq("is_visible", true).order("sort_order");
  return error ? null : (data as FeatureCardRow[]);
}, ["home-cards"], CACHE);

const loadSocials = unstable_cache(async () => {
  const { data, error } = await createPublicClient().from("social_links").select("*").eq("is_visible", true).order("sort_order");
  return error ? null : (data as SocialLinkRow[]);
}, ["home-socials"], CACHE);

const loadNotices = unstable_cache(async () => {
  const { data } = await createPublicClient().from("announcements").select("id,title,body").order("created_at", { ascending: false }).limit(3);
  return (data ?? []) as { id: string; title: string; body: string }[];
}, ["home-notices"], CACHE);

const loadSettings = unstable_cache(async () => {
  const { data } = await createPublicClient().from("site_settings").select("value").eq("key", "site").maybeSingle();
  return ((data as { value: SiteSettings } | null)?.value) ?? {};
}, ["site-settings"], CACHE);

export async function getHomeCards(): Promise<FeatureCardData[]> {
  if (!isSupabaseConfigured()) return DEFAULT_FEATURE_CARDS;
  const rows = await loadCards();
  if (!rows) return DEFAULT_FEATURE_CARDS;
  return rows.map((c) => ({
    key: c.key, title: c.title, description: c.description, href: c.href || null,
    color: c.color, bg1: c.bg1, bg2: c.bg2, icon: c.icon_url || FALLBACK_ICON,
  }));
}

export async function getHomeSocials(): Promise<SocialLinkData[]> {
  if (!isSupabaseConfigured()) return DEFAULT_SOCIAL_LINKS;
  const rows = await loadSocials();
  if (!rows) return DEFAULT_SOCIAL_LINKS;
  return rows.map((s) => ({
    key: s.key, name: s.name, action: s.action_label, subtitle: s.subtitle, href: s.href || null,
    color: s.color, glow: s.glow, border: s.border, bg1: s.bg1, bg2: s.bg2, accent: s.color, icon: s.icon_url || FALLBACK_ICON,
  }));
}

export async function getActiveAnnouncements(): Promise<{ id: string; text: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await loadNotices();
  return rows.map((a) => ({ id: a.id, text: a.body ? `${a.title} — ${a.body}` : a.title }));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return {};
  return loadSettings();
}

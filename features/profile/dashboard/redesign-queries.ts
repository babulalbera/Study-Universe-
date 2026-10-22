import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isLang, type Lang } from "@/lib/i18n";

export type PointsRank = { points: number; level: number; rank: number | null; totalUsers: number };
export type ProfileExtras = { bio: string; lang: Lang; notifyOn: boolean; pr: PointsRank };

// Agar SQL (009) abhi nahi chala, to page tootega nahi, ye default dikhega
const FALLBACK_PR: PointsRank = { points: 0, level: 1, rank: null, totalUsers: 0 };

type ProfRow = { bio?: unknown; ui_prefs?: unknown; notify_prefs?: unknown } | null;

export async function getProfileExtras(userId: string): Promise<ProfileExtras> {
  const supabase = await createClient();
  const [b, r] = await Promise.all([
    supabase.from("profiles").select("bio,ui_prefs,notify_prefs").eq("id", userId).maybeSingle(),
    supabase.rpc("my_points_rank"),
  ]);

  const row = b.data as ProfRow;
  const bio = typeof row?.bio === "string" ? row.bio.trim() : "";
  const ui = (row?.ui_prefs && typeof row.ui_prefs === "object" ? row.ui_prefs : {}) as { lang?: unknown };
  const lang: Lang = isLang(ui.lang) ? ui.lang : "en";
  const np = (row?.notify_prefs && typeof row.notify_prefs === "object" ? row.notify_prefs : {}) as { new_content?: unknown };
  const notifyOn = typeof np.new_content === "boolean" ? np.new_content : true;

  const rRow = (Array.isArray(r.data) ? r.data[0] : null) as
    | { points?: number; level?: number; user_rank?: number; total_users?: number }
    | null;
  const pr: PointsRank = rRow
    ? {
        points: Number(rRow.points ?? 0),
        level: Number(rRow.level ?? 1),
        rank: rRow.user_rank != null ? Number(rRow.user_rank) : null,
        totalUsers: Number(rRow.total_users ?? 0),
      }
    : FALLBACK_PR;

  return { bio, lang, notifyOn, pr };
}

// Settings page ke Bio box ke liye
export async function getBio(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("bio").eq("id", userId).maybeSingle();
  const bio = (data as { bio?: unknown } | null)?.bio;
  return typeof bio === "string" ? bio : "";
}

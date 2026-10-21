import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DailyQuote = { shloka: string; meaning: string; source: string };
export type PointsRank = { points: number; level: number; rank: number | null; totalUsers: number };
export type ProfileExtras = { bio: string; quote: DailyQuote; pr: PointsRank };

// Agar SQL (009) abhi nahi chala, to page tootega nahi, ye default dikhega
const FALLBACK_QUOTE: DailyQuote = {
  shloka: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
  meaning: "कर्म करना तुम्हारा अधिकार है, फल पर नहीं।",
  source: "अध्याय 2, श्लोक 47",
};
const FALLBACK_PR: PointsRank = { points: 0, level: 1, rank: null, totalUsers: 0 };

export async function getProfileExtras(userId: string): Promise<ProfileExtras> {
  const supabase = await createClient();
  const [b, q, r] = await Promise.all([
    supabase.from("profiles").select("bio").eq("id", userId).maybeSingle(),
    supabase.rpc("todays_quote"),
    supabase.rpc("my_points_rank"),
  ]);

  const rawBio = (b.data as { bio?: unknown } | null)?.bio;
  const bio = typeof rawBio === "string" ? rawBio.trim() : "";

  const qRow = (Array.isArray(q.data) ? q.data[0] : null) as Partial<DailyQuote> | null;
  const quote: DailyQuote = qRow && qRow.shloka
    ? { shloka: String(qRow.shloka), meaning: String(qRow.meaning ?? ""), source: String(qRow.source ?? "") }
    : FALLBACK_QUOTE;

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

  return { bio, quote, pr };
}

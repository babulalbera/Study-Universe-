import "server-only";
import { createClient } from "@/lib/supabase/server";

// RLS policy "see own referrals" (migration 016) ki wajah se ye count sirf apne referrals ka aata hai.
export async function getReferralCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", userId);
  return count ?? 0;
}

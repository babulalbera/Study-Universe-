import "server-only";
import { createClient } from "@/lib/supabase/server";

export type GateStatus = {
  telegramLinked: boolean; telegramUsername: string | null;
  channelMember: boolean;
  referralCount: number; referralQuota: number;
  unlocked: boolean;
  referralCode: string; linkCode: string | null;
  isAdmin: boolean;
};

export const REFERRAL_QUOTA = Number(process.env.REFERRAL_QUOTA ?? "1");

export async function getGateStatus(userId: string): Promise<GateStatus | null> {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("profiles")
    .select("role, telegram_id, telegram_username, channel_member, referral_code, link_code")
    .eq("id", userId)
    .maybeSingle();
  if (!p) return null;

  const isAdmin = p.role === "admin";
  const telegramLinked = Boolean(p.telegram_id);
  const channelMember = Boolean(p.channel_member);

  // RLS policy "see own referrals" (migration 016) ki wajah se ye count sirf apne referrals ka aata hai
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", userId)
    .eq("channel_member", true);
  const referralCount = count ?? 0;

  const unlocked = isAdmin || (telegramLinked && channelMember && referralCount >= REFERRAL_QUOTA);

  return {
    telegramLinked, telegramUsername: p.telegram_username ?? null, channelMember,
    referralCount, referralQuota: REFERRAL_QUOTA, unlocked,
    referralCode: p.referral_code ?? "", linkCode: p.link_code ?? null, isAdmin,
  };
}

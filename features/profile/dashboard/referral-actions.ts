"use server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// app/r/[code]/route.ts ek cookie "su_ref" chhod jaata hai. Jab wahi banda login/signup karke
// Profile page kholta hai, ye function ek hi baar "referred_by" set kar deta hai.
// Admin client isliye: RLS trigger normal user ko apna referred_by khud badalne se rokta hai (security).
export async function claimPendingReferral(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const jar = await cookies();
  const code = jar.get("su_ref")?.value;
  if (!code) return;

  const supabase = createAdminClient();
  const { data: me } = await supabase.from("profiles").select("referred_by, referral_code").eq("id", user.id).single();
  if (!me || me.referred_by || me.referral_code === code) return; // pehle se claim ho chuka, ya apna hi code

  const { data: referrer } = await supabase.from("profiles").select("id").eq("referral_code", code).maybeSingle();
  if (!referrer) return;

  await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", user.id);
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // jaise: -1001234567890
const CHANNEL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK; // jaise: https://t.me/apnachannel
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const REFERRAL_QUOTA = Number(process.env.REFERRAL_QUOTA ?? "1");

type Supa = ReturnType<typeof createAdminClient>;

async function tg(method: string, body: object) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => null);
}

async function isChannelMember(telegramId: number): Promise<boolean> {
  if (!CHANNEL_ID) return false;
  const data = await tg("getChatMember", { chat_id: CHANNEL_ID, user_id: telegramId });
  const status = data?.result?.status as string | undefined;
  return status === "member" || status === "administrator" || status === "creator";
}

// Telegram link ho jaane (ya dobara /start karne) ke baad, abhi kaunsa step baaki hai — wahi message bhejo
async function sendStatusMessage(supabase: Supa, profileId: string, chatId: number, tgId: number) {
  const member = await isChannelMember(tgId);
  await supabase.from("profiles").update({ channel_member: member }).eq("id", profileId);

  if (!member) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "✅ Telegram link ho gaya!\n\nAb hamara Channel join karo, fir yahi /start dobara bhejo ya app me 'Check Status' dabao.",
      reply_markup: CHANNEL_LINK ? { inline_keyboard: [[{ text: "📢 Channel Join Karo", url: CHANNEL_LINK }]] } : undefined,
    });
    return;
  }

  const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", profileId).eq("channel_member", true);
  const have = count ?? 0;

  if (have < REFERRAL_QUOTA) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: `✅ Telegram + Channel done!\n📊 Active Referrals: ${have} / ${REFERRAL_QUOTA}\n\n${REFERRAL_QUOTA - have} aur dost ko apna Referral Link bhejo (StudyUniverse Gate page se milega).`,
    });
    return;
  }

  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎉 Sab complete! Tumhari StudyUniverse site unlock ho gayi hai.",
    reply_markup: SITE_URL ? { inline_keyboard: [[{ text: "🚀 Open StudyUniverse", url: SITE_URL }]] } : undefined,
  });
}

// "/start r_<referral_code>" — kisi doston ke referral link se naya banda aaya
async function handleReferralStart(supabase: Supa, refCode: string, chatId: number, tgId: number) {
  const { data: referrer } = await supabase.from("profiles").select("id").eq("referral_code", refCode).maybeSingle();
  if (!referrer) {
    await tg("sendMessage", { chat_id: chatId, text: "Ye referral link sahi nahi hai ya purana ho gaya." });
    return;
  }

  // Ye Telegram user agar pehle se kisi StudyUniverse account se bound hai, to seedha abhi credit de do
  const { data: already } = await supabase.from("profiles").select("id, referred_by").eq("telegram_id", tgId).maybeSingle();
  if (already) {
    if (!already.referred_by && already.id !== referrer.id) {
      await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", already.id).is("referred_by", null);
    }
    await tg("sendMessage", { chat_id: chatId, text: "✅ Referral set ho gaya! Apna status check karne ke liye /start bhejo." });
    return;
  }

  // Abhi koi StudyUniverse account bound nahi hai — referrer yaad rakho, jab account bind hoga tab credit milega
  await supabase.from("pending_referrals").upsert({ telegram_id: tgId, referrer_id: referrer.id });
  await tg("sendMessage", {
    chat_id: chatId,
    text: "👋 Welcome! Pehle StudyUniverse website par Signup/Login karo. Wahan 'Link Code banao' dabake jo code milega, usko yahin bot me /start <code> se bhejo — tumhara referral automatically count ho jayega.",
    reply_markup: SITE_URL ? { inline_keyboard: [[{ text: "🌐 StudyUniverse Kholo", url: SITE_URL }]] } : undefined,
  });
}

export async function POST(req: Request) {
  if (!SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const supabase = createAdminClient();

  // CASE 1: hamare REQUIRED channel me koi join/leave hua — real-time re-lock isi se hota hai
  const cm = update?.chat_member;
  if (cm && CHANNEL_ID && String(cm.chat?.id) === String(CHANNEL_ID)) {
    const tgId = cm.new_chat_member?.user?.id as number | undefined;
    const status = cm.new_chat_member?.status as string | undefined;
    if (tgId) {
      const isMember = status === "member" || status === "administrator" || status === "creator";
      await supabase.from("profiles").update({ channel_member: isMember }).eq("telegram_id", tgId);
    }
    return NextResponse.json({ ok: true });
  }

  // CASE 2: /start command (referral code, ya bind code, ya dobara status-check)
  const msg = update?.message;
  const text: string | undefined = msg?.text;
  if (!text?.startsWith("/start")) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;
  const code = text.replace("/start", "").trim();
  const tgId = msg.from.id as number;
  const tgUsername = (msg.from.username as string | undefined) ?? null;

  if (!code) {
    const { data: existing } = await supabase.from("profiles").select("id").eq("telegram_id", tgId).maybeSingle();
    if (existing) await sendStatusMessage(supabase, existing.id, chatId, tgId);
    else await tg("sendMessage", { chat_id: chatId, text: "Pehle StudyUniverse Gate page se 'Link Code banao' dabao, phir yahan aao." });
    return NextResponse.json({ ok: true });
  }

  // Referral link se aaya hai (code "r_" se shuru hota hai)
  if (code.toLowerCase().startsWith("r_")) {
    await handleReferralStart(supabase, code.slice(2).toLowerCase(), chatId, tgId);
    return NextResponse.json({ ok: true });
  }

  // Normal Bind Code flow
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, link_code_expires_at")
    .eq("link_code", code)
    .maybeSingle();

  if (!profile || !profile.link_code_expires_at || new Date(profile.link_code_expires_at) < new Date()) {
    await tg("sendMessage", { chat_id: chatId, text: "Ye code galat ya purana ho gaya. App mein jaakar naya code banao." });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ telegram_id: tgId, telegram_username: tgUsername, telegram_linked_at: new Date().toISOString(), link_code: null, link_code_expires_at: null })
    .eq("id", profile.id);

  if (error) {
    await tg("sendMessage", { chat_id: chatId, text: "Ye Telegram account pehle se kisi aur StudyUniverse account se juda hai." });
    return NextResponse.json({ ok: true });
  }

  // Agar ye banda pehle kisi referral link se aaya tha (pending_referrals me baitha tha), to ab credit de do
  const { data: pending } = await supabase.from("pending_referrals").select("referrer_id").eq("telegram_id", tgId).maybeSingle();
  if (pending && pending.referrer_id !== profile.id) {
    await supabase.from("profiles").update({ referred_by: pending.referrer_id }).eq("id", profile.id).is("referred_by", null);
    await supabase.from("pending_referrals").delete().eq("telegram_id", tgId);
  }

  await sendStatusMessage(supabase, profile.id, chatId, tgId);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function tg(method: string, body: object) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Telegram ye webhook sirf "setWebhook" karte waqt diya hua secret_token header bhejega.
// Agar header match nahi karta, to request Telegram ki nahi hai — reject karo.
export async function POST(req: Request) {
  if (!SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const text: string | undefined = msg?.text;
  if (!text?.startsWith("/start")) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;
  const code = text.replace("/start", "").trim();
  if (!code) {
    await tg("sendMessage", { chat_id: chatId, text: "Pehle StudyUniverse Profile page se 'Link Code banao' dabao, phir yahan aao." });
    return NextResponse.json({ ok: true });
  }

  const tgId = msg.from.id as number;
  const tgUsername = (msg.from.username as string | undefined) ?? null;

  const supabase = createAdminClient();
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
    // Unique constraint violation = ye Telegram account pehle se kisi aur profile se juda hai
    await tg("sendMessage", { chat_id: chatId, text: "Ye Telegram account pehle se kisi aur StudyUniverse account se juda hai." });
    return NextResponse.json({ ok: true });
  }

  await tg("sendMessage", { chat_id: chatId, text: "✅ Telegram link ho gaya! Ab StudyUniverse Profile page refresh karo." });
  return NextResponse.json({ ok: true });
}

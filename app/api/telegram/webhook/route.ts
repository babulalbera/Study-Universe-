// Telegram channel me video aate hi Telegram yahan khabar bhejta hai.
// Hum video download nahi karte, sirf uska link (t.me/channel/123) database me daalte hain.
// Env chahiye: TELEGRAM_WEBHOOK_SECRET, TELEGRAM_COURSE_ID, TELEGRAM_CHANNEL_USERNAME
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = () => NextResponse.json({ ok: true });

type TgPost = {
  message_id: number;
  caption?: string;
  chat?: { username?: string };
  video?: { file_name?: string };
  document?: { mime_type?: string; file_name?: string };
};

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const courseId = process.env.TELEGRAM_COURSE_ID;
  const channel = process.env.TELEGRAM_CHANNEL_USERNAME?.replace(/^@/, "").toLowerCase();

  // 1) Sirf Telegram hi bhej sake: secret match hona chahiye
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!courseId || !UUID.test(courseId) || !channel) {
    console.error("[telegram] env set nahi: TELEGRAM_COURSE_ID / TELEGRAM_CHANNEL_USERNAME");
    return ok();
  }

  let body: { channel_post?: TgPost };
  try { body = await req.json(); } catch { return ok(); }
  const post = body.channel_post;
  if (!post) return ok();

  // 2) Sirf video, aur sirf aapke apne channel se (koi aur bot ko apne channel me jode to bhi nahi chalega)
  const isVideo = !!post.video || !!post.document?.mime_type?.startsWith("video/");
  const username = post.chat?.username;
  if (!isVideo || !username || username.toLowerCase() !== channel) return ok();

  const url = `https://t.me/${username}/${post.message_id}`;
  const title = (post.caption?.split("\n")[0] || post.video?.file_name || post.document?.file_name || "Lecture").trim().slice(0, 150);

  try {
    const db = createAdminClient();
    // 3) Telegram kabhi-kabhi wahi update dobara bhejta hai, isliye duplicate rokna
    const { data: dup } = await db.from("course_videos").select("id").eq("course_id", courseId).eq("url", url).maybeSingle();
    if (dup) return ok();
    const { error } = await db.from("course_videos").insert({
      course_id: courseId,
      title: title.length >= 2 ? title : "Lecture",
      source: "telegram",
      url,
    });
    if (error) console.error("[telegram] insert fail:", error.message);
  } catch (e) {
    console.error("[telegram] error:", e);
  }
  return ok();
}

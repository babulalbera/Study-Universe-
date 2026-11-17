// Telegram channel me video aate hi Telegram yahan khabar bhejta hai.
// Hum video download nahi karte, sirf uska link (t.me/channel/123) database me daalte hain.
// Env chahiye: TELEGRAM_WEBHOOK_SECRET, TELEGRAM_COURSE_ID, TELEGRAM_CHANNEL_USERNAME
//
// Caption ki pehli line se Folder aur Title milte hain:
//   "Maths | Percentage Lecture 1"  ->  Folder "Maths", Title "Percentage Lecture 1"
//   "Percentage Lecture 1"          ->  koi folder nahi, seedha course me
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

type Db = ReturnType<typeof createAdminClient>;

// Caption ki pehli line ko "Folder | Title" me todo
function splitCaption(caption: string | undefined, fallback: string): { folder: string | null; title: string } {
  const first = (caption ?? "").split("\n")[0].trim();
  const i = first.indexOf("|");
  if (i > 0) {
    const folder = first.slice(0, i).trim().slice(0, 100);
    const title = first.slice(i + 1).trim() || fallback;
    return { folder: folder.length >= 2 ? folder : null, title };
  }
  return { folder: null, title: first || fallback };
}

// Is naam ka folder is course me dhoondo (bade-chhote akshar ka farak nahi). Na mile to naya bana do.
async function folderIdFor(db: Db, courseId: string, name: string): Promise<string | null> {
  const { data } = await db.from("course_folders").select("id, title").eq("course_id", courseId).limit(200);
  const list = (data ?? []) as { id: string; title: string }[];
  const hit = list.find((f) => f.title.trim().toLowerCase() === name.toLowerCase());
  if (hit) return hit.id;
  const { data: made, error } = await db
    .from("course_folders")
    .insert({ course_id: courseId, title: name, sort_order: list.length })
    .select("id")
    .single();
  if (error || !made) {
    console.error("[telegram] folder nahi bana:", error?.message);
    return null;
  }
  return (made as { id: string }).id;
}

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
  const fallback = post.video?.file_name || post.document?.file_name || "Lecture";
  const { folder, title: rawTitle } = splitCaption(post.caption, fallback);
  const title = rawTitle.slice(0, 150).length >= 2 ? rawTitle.slice(0, 150) : "Lecture";

  try {
    const db = createAdminClient();
    // 3) Telegram kabhi-kabhi wahi update dobara bhejta hai, isliye duplicate rokna
    const { data: dup } = await db.from("course_videos").select("id").eq("course_id", courseId).eq("url", url).maybeSingle();
    if (dup) return ok();

    const folderId = folder ? await folderIdFor(db, courseId, folder) : null;
    const { error } = await db.from("course_videos").insert({
      course_id: courseId,
      folder_id: folderId,
      title,
      source: "telegram",
      url,
    });
    if (error) console.error("[telegram] insert fail:", error.message);
  } catch (e) {
    console.error("[telegram] error:", e);
  }
  return ok();
}

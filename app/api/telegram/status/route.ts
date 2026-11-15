import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGateStatus } from "@/features/gate/queries";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

// "Check Status" button isko call karta hai — webhook se jo update miss ho jaye, usko yahan live re-check kar lete hain.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login karo" }, { status: 401 });

  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("telegram_id").eq("id", user.id).maybeSingle();

  if (p?.telegram_id && BOT_TOKEN && CHANNEL_ID) {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${p.telegram_id}`);
    const data = await res.json().catch(() => null);
    const status = data?.result?.status as string | undefined;
    const isMember = status === "member" || status === "administrator" || status === "creator";
    await admin.from("profiles").update({ channel_member: isMember }).eq("id", user.id);
  }

  const status = await getGateStatus(user.id);
  return NextResponse.json(status);
}

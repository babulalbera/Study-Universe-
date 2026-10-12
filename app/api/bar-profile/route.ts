import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
const HEADERS = { "Cache-Control": "private, no-store" };

function parse<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// Bottom Bar ke Profile sheet ke liye: sirf login user ka apna data. Date/streak ka hisaab browser (user ke local din) mein hota hai.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ loggedIn: false }, { headers: HEADERS });

  const profile = await getProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("user_task_data").select("data").eq("user_id", user.id).maybeSingle();
  const d = ((data as { data: Record<string, string> } | null)?.data) ?? {};

  const tasks = parse<unknown[]>(d["studyUniverse.tasks.v1"]);
  const done = parse<{ date?: string; ids?: unknown[] }>(d["studyUniverse.done.v1"]);
  const hist = parse<Record<string, number>>(d["studyUniverse.hist.v1"]);

  return NextResponse.json({
    loggedIn: true,
    name: profile?.full_name || user.email?.split("@")[0] || "Student",
    role: profile?.role ?? "student",
    tasks: Array.isArray(tasks) ? tasks.length : 24,
    done: done && typeof done.date === "string" && Array.isArray(done.ids) ? { date: done.date, count: done.ids.length } : null,
    hist: hist ?? {},
  }, { headers: HEADERS });
}

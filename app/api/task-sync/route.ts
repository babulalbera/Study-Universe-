import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "studyUniverse.tasks.v1", "studyUniverse.done.v1", "studyUniverse.todos.v1",
  "studyUniverse.dayNotes.v1", "studyUniverse.todoTheme.v1", "studyUniverse.hist.v1", "studyUniverse.log.v1",
]);
const MAX_CHARS = 2_000_000;

// Sirf login user, sirf apni row. Sirf pehchane hue keys, sahi JSON, size ki hadd.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "json" }, { status: 400 }); }
  const data = (body as { data?: unknown } | null)?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ error: "data" }, { status: 400 });

  const clean: Record<string, string> = {};
  let total = 0;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (!ALLOWED.has(k)) continue;
    if (typeof v !== "string") return NextResponse.json({ error: "value" }, { status: 400 });
    try { JSON.parse(v); } catch { return NextResponse.json({ error: "json-value" }, { status: 400 }); }
    total += k.length + v.length;
    clean[k] = v;
  }
  if (total > MAX_CHARS) return NextResponse.json({ error: "too-large" }, { status: 413 });

  const supabase = await createClient();
  const { error } = await supabase.from("user_task_data").upsert({ user_id: user.id, data: clean });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

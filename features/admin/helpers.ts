import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const num = (f: FormData, k: string) => { const v = Number(s(f, k)); return Number.isFinite(v) ? Math.trunc(v) : 0; };
export const dec = (f: FormData, k: string, d = 0) => { const v = Number(s(f, k)); return Number.isFinite(v) ? v : d; };
export const on = (f: FormData, k: string) => f.get("" + k) === "on";

export function back(path: string, kind: "ok" | "error", msg: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);
}
export async function ctx() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  return { profile, supabase };
}
export type Ctx = Awaited<ReturnType<typeof ctx>>;
export async function audit(c: Ctx, action: string, table: string, id: string | null, details: Record<string, unknown> = {}) {
  await c.supabase.from("audit_logs").insert({ actor_id: c.profile.id, action, table_name: table, record_id: id, details });
}
export const refresh = (paths: string[]) => paths.forEach((p) => revalidatePath(p));

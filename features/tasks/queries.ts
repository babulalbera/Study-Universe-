import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Task } from "@/types/database";

export async function getTasksWithStatus(): Promise<{ tasks: Task[]; doneIds: string[]; loggedIn: boolean }> {
  if (!isSupabaseConfigured()) return { tasks: [], doneIds: [], loggedIn: false };
  const supabase = await createClient();
  const user = await getUser();
  const { data } = await supabase.from("tasks").select("*").eq("is_active", true).order("sort_order").order("created_at", { ascending: false }).limit(200);
  let doneIds: string[] = [];
  if (user) {
    const { data: d } = await supabase.from("task_completions").select("task_id").eq("user_id", user.id);
    doneIds = ((d ?? []) as { task_id: string }[]).map((r) => r.task_id);
  }
  return { tasks: (data ?? []) as Task[], doneIds, loggedIn: Boolean(user) };
}

"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sirf apni completion (RLS bhi user_id = login user par rokta hai)
export async function toggleTask(taskId: string, done: boolean): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user || !UUID.test(taskId)) return { ok: false };
  const supabase = await createClient();
  const { error } = done
    ? await supabase.from("task_completions").upsert({ user_id: user.id, task_id: taskId })
    : await supabase.from("task_completions").delete().eq("user_id", user.id).eq("task_id", taskId);
  if (error) return { ok: false };
  revalidatePath("/tasks");
  return { ok: true };
}

import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import TasksBoard from "@/components/tasks/TasksBoard";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Daily Tasks" };
export const dynamic = "force-dynamic";

// Tasks page: React + Tailwind, site ke baaki pages jaisa (iframe nahi).
// Data user_task_data se aata hai aur badlav /api/task-sync par save hote hain (Profile ke stats isi data se bante hain).
export default async function TasksPage() {
  const user = await getUser();
  let initial: Record<string, string> = {};
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("user_task_data").select("data").eq("user_id", user.id).maybeSingle();
    initial = ((data as { data: Record<string, string> } | null)?.data) ?? {};
  }
  return (
    <>
      <PageHeader title="✅ Daily Tasks" subtitle="Roz ke tasks, streak aur progress — ek hi jagah." />
      <TasksBoard initial={initial} loggedIn={Boolean(user)} />
    </>
  );
}

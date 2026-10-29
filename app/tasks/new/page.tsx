import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import TasksBoard from "@/components/tasks/TasksBoard";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Daily Tasks (naya)" };
export const dynamic = "force-dynamic";

// NAYA Tasks page (React + Tailwind, iframe ke bina). Purana page /tasks par chalta rahega,
// jab tak naya poora ready na ho. Data wahi hai (user_task_data), isliye dono me ek jaisa dikhta hai.
export default async function TasksNewPage() {
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

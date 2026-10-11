import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import TaskList from "@/features/tasks/TaskList";
import { getTasksWithStatus } from "@/features/tasks/queries";

export const metadata: Metadata = { title: "Daily Tasks" };

export default async function TasksPage() {
  const { tasks, doneIds, loggedIn } = await getTasksWithStatus();
  return (
    <>
      <PageHeader title="✅ Daily Tasks" subtitle="रोज़ के Task पूरे करो, Streak बनाओ।" />
      {tasks.length === 0 ? (
        <EmptyState icon="🗒️" title="अभी कोई Task नहीं है" text="Admin Panel से Task जुड़ते ही यहाँ दिखेंगे।" />
      ) : (
        <TaskList tasks={tasks} doneIds={doneIds} loggedIn={loggedIn} />
      )}
    </>
  );
}

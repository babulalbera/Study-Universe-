import type { Metadata } from "next";
import Link from "next/link";
import TaskFrame from "@/features/tasks/TaskFrame";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Daily Tasks" };

export default async function TasksPage() {
  const user = await getUser();
  return (
    <>
      {!user && (
        <p className="glass su-muted" style={{ padding: "10px 14px" }}>
          ⚠️ Login के बिना Tasks सिर्फ़ इसी फोन में रहेंगे। <Link href="/login?next=/tasks" style={{ color: "var(--gold2)", fontWeight: 700 }}>Login करो</Link> ताकि हर जगह मिलें।
        </p>
      )}
      <TaskFrame />
    </>
  );
}

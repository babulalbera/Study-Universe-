import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import TaskFrame from "@/components/tasks/TaskFrame";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Daily Tasks" };
export const dynamic = "force-dynamic";

// Books / Courses jaisa normal page: layout ka Header, Krishna boxes aur Bottom bar yahan apne aap aate hain.
export default async function TasksPage() {
  const user = await getUser();
  return (
    <>
      <PageHeader title="✅ Daily Tasks" subtitle="Roz ke tasks, streak aur progress — ek hi jagah." />
      {!user && (
        <div className="su-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <p style={{ fontFamily: "var(--dev)" }}>⚠️ Login के बिना Tasks सिर्फ़ इसी फोन में रहेंगे।</p>
          <Link className="su-btn su-btn-primary" href="/login?next=/tasks">Login करो</Link>
        </div>
      )}
      <TaskFrame />
    </>
  );
}

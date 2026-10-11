"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Task } from "@/types/database";
import { cn } from "@/lib/utils";
import { toggleTask } from "./actions";

export default function TaskList({ tasks, doneIds, loggedIn }: { tasks: Task[]; doneIds: string[]; loggedIn: boolean }) {
  const [done, setDone] = useState<Set<string>>(new Set(doneIds));
  const [err, setErr] = useState("");
  const [, start] = useTransition();
  const count = tasks.filter((t) => done.has(t.id)).length;
  const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;

  function flip(id: string, next: boolean) {
    setDone((p) => { const n = new Set(p); if (next) n.add(id); else n.delete(id); return n; });
  }
  function onToggle(id: string) {
    setErr("");
    const next = !done.has(id);
    flip(id, next);
    start(async () => {
      const r = await toggleTask(id, next);
      if (!r.ok) { flip(id, !next); setErr("Save nahi hua, dobara try karo."); }
    });
  }

  return (
    <>
      <div className="glass su-stat"><b>{count}/{tasks.length}</b><span>Task पूरे • {pct}%</span></div>
      {!loggedIn && (
        <p className="su-muted">Complete मार्क करने के लिए <Link href="/login?next=/tasks" style={{ color: "var(--gold2)", fontWeight: 700 }}>Login करो</Link>.</p>
      )}
      {err && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{err}</p>}
      <div className="su-list">
        {tasks.map((t) => (
          <div key={t.id} className="su-item">
            <div className={cn(done.has(t.id) && "su-done")} style={{ minWidth: 0 }}>
              <h3>{t.title}</h3>
              <p>{[t.subject, t.note, t.due_date && `तारीख: ${t.due_date}`].filter(Boolean).join(" • ")}</p>
            </div>
            <button type="button" disabled={!loggedIn} className={cn("su-check", done.has(t.id) && "on")} aria-pressed={done.has(t.id)}
              aria-label={`${t.title} पूरा मार्क करो`} onClick={() => onToggle(t.id)}>
              {done.has(t.id) ? "✓" : ""}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

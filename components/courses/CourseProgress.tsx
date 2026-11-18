"use client";
import { useEffect, useState } from "react";
import { getDone, onDoneChange, syncDone } from "@/lib/course-progress";
import "./course-progress.css";

// "5 / 20 complete" + progress bar. Login ho to kisi bhi mobile par wahi hisaab dikhta hai.
export default function CourseProgress({ courseId, total, compact = false }: { courseId: string; total: number; compact?: boolean }) {
  const [done, setDoneN] = useState(0);

  useEffect(() => {
    const sync = () => setDoneN(getDone(courseId).length);
    sync();
    void syncDone(courseId);
    return onDoneChange(courseId, sync);
  }, [courseId]);

  if (total <= 0) return null;
  const n = Math.min(done, total);
  const pct = Math.round((n / total) * 100);
  return (
    <div className={`cv-prog${compact ? " compact" : ""}${n === total ? " all" : ""}`} role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n}>
      <div className="cv-prog-top">
        <span>{n === total ? "🎉 Course complete" : `${n} / ${total} complete`}</span>
        <b>{pct}%</b>
      </div>
      <div className="cv-prog-bar"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

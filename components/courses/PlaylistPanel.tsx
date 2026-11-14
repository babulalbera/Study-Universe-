"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDone, onDoneChange } from "@/lib/course-progress";

export type PlaylistSection = { key: string; title: string | null; items: { id: string; title: string; n: number }[] };

// Side ki Playlist: complete wale lecture par ✓, abhi chal raha video sone jaisa, aur course ki progress.
export default function PlaylistPanel({ courseId, currentId, total, sections }: { courseId: string; currentId: string; total: number; sections: PlaylistSection[] }) {
  const ref = useRef<HTMLElement>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sync = () => setDone(new Set(getDone(courseId)));
    sync();
    return onDoneChange(courseId, sync);
  }, [courseId]);

  // Lambi list me abhi wala video beech me dikhe (sirf jahan list khud scroll hoti hai)
  useEffect(() => {
    const aside = ref.current;
    const row = aside?.querySelector<HTMLElement>(".cv-row.on");
    if (!aside || !row || aside.scrollHeight <= aside.clientHeight + 4) return;
    aside.scrollTop = row.offsetTop - aside.clientHeight / 2 + row.clientHeight / 2;
  }, [currentId]);

  const count = sections.reduce((n, s) => n + s.items.filter((i) => done.has(i.id)).length, 0);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <aside ref={ref} className="cv-side cv-side-pro" aria-label="Playlist">
      <h3 className="cv-side-title">📚 Playlist ({total})</h3>
      <div className="cv-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} aria-label="Kitne lecture complete hue">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="cv-prog-t">{count} / {total} complete · {pct}%</p>
      {sections.map((s) => (
        <div key={s.key} className="cv-folder">
          {s.title && <h4>{s.title}</h4>}
          <div className="cv-list">
            {s.items.map((v) => {
              const on = v.id === currentId;
              const ok = done.has(v.id);
              return (
                <Link key={v.id} href={`/courses/${courseId}/watch/${v.id}`} className={`cv-row${on ? " on" : ""}${ok ? " done" : ""}`} aria-current={on ? "true" : undefined}>
                  <span className="cv-num">{on ? "▶" : ok ? "✓" : v.n}</span>
                  <span className="cv-title">{v.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

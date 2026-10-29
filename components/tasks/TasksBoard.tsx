"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MOTIVATION } from "@/features/tasks/default-tasks";
import { countToday, isUnlocked, todayTasks, type Filter } from "@/features/tasks/model";
import { useTaskStore } from "@/features/tasks/useTaskStore";
import TaskCard from "./TaskCard";
import TaskStats from "./TaskStats";

// Poora Tasks page: motivation, stats, filter aur task cards (site ke baaki pages jaisa, iframe ke bina).
export default function TasksBoard({ initial, loggedIn }: { initial: Record<string, string>; loggedIn: boolean }) {
  const st = useTaskStore(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [focus, setFocus] = useState(false);
  const [mi, setMi] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setMi((i) => (i + 1) % MOTIVATION.length), 4000);
    return () => clearInterval(iv);
  }, []);

  if (!loggedIn) {
    return (
      <div className="su-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontFamily: "var(--dev)" }}>Tasks dekhne ke liye pehle Login karo।</p>
        <Link className="su-btn su-btn-primary" href="/login?next=/tasks/new">Login करो</Link>
      </div>
    );
  }

  if (!st.ready) {
    return (
      <div aria-busy="true" className="space-y-4">
        <div className="glass h-[250px] animate-pulse" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[190px] animate-pulse rounded-2xl border border-white/[0.09] bg-white/[0.04]" />)}
        </div>
      </div>
    );
  }

  const all = todayTasks(st.tasks);
  const total = countToday(st.tasks);
  const numberOf = new Map(all.map((t, i) => [t.id, i + 1]));
  const shown = filter === "done" ? all.filter((t) => st.done.has(t.id)) : filter === "pending" ? all.filter((t) => !st.done.has(t.id)) : all;

  return (
    <div className="space-y-4">
      <div className="su-item" aria-live="off">
        <div className="min-w-0">
          <p className="text-[10.5px] font-black tracking-widest text-[color:var(--mute)]">💡 MOTIVATION • BEST BANAO</p>
          <p key={mi} className="mt-1 text-[15px] font-bold leading-tight text-[color:var(--gold3)]">“{MOTIVATION[mi]}”</p>
        </div>
      </div>

      <TaskStats doneCount={st.done.size} total={total} streak={st.streak} now={st.nowMin} filter={filter} onFilter={setFilter} focus={focus} onFocus={() => setFocus((f) => !f)} />

      <div className="flex items-center justify-between gap-2 pt-1">
        <h2 className="text-[17px] font-black tracking-tight text-[color:var(--gold2)]">📅 Today Task • {total} Tasks</h2>
        <p className="hidden text-[11px] font-medium text-[color:var(--mute)] md:block">Time lock on • End ke baad unlock</p>
      </div>

      {shown.length === 0 ? (
        <div className="su-item"><p>{filter === "done" ? "Abhi koi task complete nahi hua." : "Saare tasks complete! 🎉"}</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => {
            const done = st.done.has(t.id);
            const live = st.nowMin >= t.start && st.nowMin < t.end && !done;
            return (
              <TaskCard key={t.id} task={t} no={numberOf.get(t.id) ?? 0} now={st.nowMin} done={done}
                unlocked={isUnlocked(t, st.nowMin, st.done)} dim={focus && !live && !done} onToggle={st.toggle} />
            );
          })}
        </div>
      )}
    </div>
  );
}

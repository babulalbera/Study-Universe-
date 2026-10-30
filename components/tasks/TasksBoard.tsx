"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { BLESSINGS } from "@/features/tasks/blessings";
import { MOTIVATION } from "@/features/tasks/default-tasks";
import { countToday, hm, isUnlocked, today, todayTasks, type Filter, type Task, type TaskForm as Form } from "@/features/tasks/model";
import { useTaskStore } from "@/features/tasks/useTaskStore";
import BlessingPopup, { type BlessingData } from "./BlessingPopup";
import Confetti, { makeConfetti, type Piece } from "./Confetti";
import TaskCard from "./TaskCard";
import TaskFormModal from "./TaskForm";
import type { MenuAction } from "./TaskMenu";
import TaskStats from "./TaskStats";
import TaskToast, { type ToastData } from "./TaskToast";
import "./tasks.css";

type FormState = { task: Task | null; focus: "title" | "reminder"; key: number } | null;

// Poora Tasks page: motivation, stats, filter aur task cards (site ke baaki pages jaisa, iframe ke bina).
export default function TasksBoard({ initial, loggedIn }: { initial: Record<string, string>; loggedIn: boolean }) {
  const st = useTaskStore(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [focus, setFocus] = useState(false);
  const [mi, setMi] = useState(0);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [confirm, setConfirm] = useState<Task | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [bless, setBless] = useState<BlessingData | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tasksRef = useRef<Task[]>([]);

  const say = useCallback((msg: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), undo ? 5000 : 2400);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setMi((i) => (i + 1) % MOTIVATION.length), 4000);
    return () => clearInterval(iv);
  }, []);

  // Reminder: har 20 second me dekho, kisi task ka reminder abhi ke HH:MM par hai to message + notification
  useEffect(() => { tasksRef.current = st.tasks; });
  useEffect(() => {
    const fired = new Set<string>();
    const iv = setInterval(() => {
      const d = new Date();
      const t0 = hm(d.getHours() * 60 + d.getMinutes());
      const day = today();
      for (const t of tasksRef.current) {
        if (!t.reminder || (t.date && t.date !== day)) continue;
        const key = `${t.id}${day}${t0}`;
        if (t.startTime && t.reminder === t0 && !fired.has(key)) {
          fired.add(key);
          say(`⏰ ${t.title}`);
          try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Study Universe", { body: t.title }); } catch { /* ignore */ }
        }
      }
    }, 20000);
    return () => clearInterval(iv);
  }, [say]);

  // Task complete hua: confetti + Jai Shree Krishna popup (undo par kuch nahi)
  const onToggle = (t: Task) => {
    if (st.toggle(t) !== "done") return;
    setBless({ taskName: t.title, taskHi: t.titleHi, quoteIdx: Math.floor(Math.random() * BLESSINGS.length), key: Date.now() });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPieces(makeConfetti());
      setTimeout(() => setPieces([]), 2400);
    }
  };
  const openForm = (task: Task | null, f: "title" | "reminder" = "title") => setForm({ task, focus: f, key: Date.now() });

  const onAction = (t: Task, a: MenuAction) => {
    setMenuId(null);
    if (a === "edit") openForm(t);
    else if (a === "add") openForm(null);
    else if (a === "reminder") openForm(t, "reminder");
    else if (a === "remove") setConfirm(t);
    else if (a === "pending") { st.markPending(t); say("Task pending kar diya"); }
    else if (a.startsWith("prio:")) { const p = a.slice(5); st.setPriority(t, p); say(`Priority: ${p}`); }
  };

  const onSave = (f: Form, base: Task | null) => {
    st.saveTask(f, base);
    setForm(null);
    say(base ? "Task update ho gaya ✅" : "Task add ho gaya ✅");
  };

  const doRemove = () => {
    const t = confirm;
    if (!t) return;
    setConfirm(null);
    const wasDone = st.removeTask(t);
    say("Task remove ho gaya", () => st.restoreTask(t, wasDone));
  };

  if (!loggedIn) {
    return (
      <div className="su-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontFamily: "var(--dev)" }}>Tasks dekhne ke liye pehle Login karo।</p>
        <Link className="su-btn su-btn-primary" href="/login?next=/tasks">Login करो</Link>
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
        <button type="button" className="su-btn su-btn-primary !h-9 !px-4 !text-[12px]" onClick={() => openForm(null)}>+ Add Task</button>
      </div>
      <p className="-mt-2 hidden text-[11px] font-medium text-[color:var(--mute)] md:block">Time lock on • End ke baad unlock</p>

      {shown.length === 0 ? (
        <div className="su-item"><p>{filter === "done" ? "Abhi koi task complete nahi hua." : "Koi task nahi hai. “+ Add Task” se naya banao."}</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => {
            const done = st.done.has(t.id);
            const live = st.nowMin >= t.start && st.nowMin < t.end && !done;
            return (
              <TaskCard key={t.id} task={t} no={numberOf.get(t.id) ?? 0} now={st.nowMin} done={done}
                unlocked={isUnlocked(t, st.nowMin, st.done)} dim={focus && !live && !done} onToggle={onToggle}
                menuOpen={menuId === t.id} onMenu={(o) => setMenuId(o ? t.id : null)} onAction={onAction} />
            );
          })}
        </div>
      )}

      {form && <TaskFormModal key={form.key} task={form.task} focus={form.focus} onClose={() => setForm(null)} onSave={onSave} />}
      <ConfirmDialog open={confirm !== null} title="🗑️ Task hatana hai?" text={confirm ? `${confirm.title} hat jayega (Undo milega).` : ""} onConfirm={doRemove} onCancel={() => setConfirm(null)} />
      <TaskToast toast={toast} onDone={() => setToast(null)} />
      <Confetti pieces={pieces} />
      {bless && <BlessingPopup key={bless.key} data={bless} onClose={() => setBless(null)} />}
    </div>
  );
}

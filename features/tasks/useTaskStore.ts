"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { KEYS, type Mem, type Task, type TaskForm, buildTask, isUnlocked, loadDone, loadTasks, nowMinutes, sortTasks, streakFor, today, writeDone } from "./model";

type Data = { tasks: Task[]; done: Set<number>; streak: number };

// Tasks ka data: server se aaya `initial` (user_task_data) ko memory me rakhta hai,
// badlav par 1.2 second baad /api/task-sync par poora data wapas save karta hai (purane page jaisa).
export function useTaskStore(initial: Mem) {
  const mem = useRef<Mem>({ ...initial });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const cur = useRef<Data | null>(null); // sabse taaza data (Undo jaise der se chalne wale kaam purana data na dekhein)
  const nowRef = useRef(0);
  const [data, setData] = useState<Data | null>(null);
  const [nowMin, setNowMin] = useState<number | null>(null);

  const flush = useCallback((unload = false) => {
    if (!dirty.current) return;
    dirty.current = false;
    if (timer.current) clearTimeout(timer.current);
    const body = JSON.stringify({ data: mem.current });
    fetch("/api/task-sync", {
      method: "POST", headers: { "Content-Type": "application/json" }, body, credentials: "same-origin",
      keepalive: unload && body.length < 60000,
    }).then((r) => { if (!r.ok) dirty.current = true; }).catch(() => { dirty.current = true; });
  }, []);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(false), 1200);
  }, [flush]);

  // Page khulte hi (sirf browser me, taaki server/phone ke time ka mel-jol na bigde) data taiyar karo
  useEffect(() => {
    const { list, missing } = loadTasks(mem.current, Date.now());
    if (missing) { mem.current[KEYS.tasks] = JSON.stringify(list); schedule(); }
    const done = loadDone(mem.current);
    const d = { tasks: list, done, streak: streakFor(mem.current, done.size) };
    cur.current = d;
    setData(d);
    nowRef.current = nowMinutes();
    setNowMin(nowRef.current);
    const iv = setInterval(() => { nowRef.current = nowMinutes(); setNowMin(nowRef.current); }, 30000);
    return () => clearInterval(iv);
  }, [schedule]);

  // Page band / tab chhupne par pending save bhej do
  useEffect(() => {
    const hide = () => { if (document.visibilityState === "hidden") flush(true); };
    const leave = () => flush(true);
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("pagehide", leave); document.removeEventListener("visibilitychange", hide); };
  }, [flush]);

  // Ek jagah se sab badlav: tasks aur/ya done. Pehle tasks likhte hain, phir done (taaki log naye tasks se bane)
  const commit = useCallback((next: { tasks?: Task[]; done?: Set<number> }) => {
    const d = cur.current;
    if (!d) return;
    const tasks = next.tasks ?? d.tasks;
    const done = next.done ?? d.done;
    if (next.tasks) mem.current[KEYS.tasks] = JSON.stringify(tasks);
    if (next.done) writeDone(mem.current, today(), Array.from(done));
    schedule();
    const nd = { tasks, done, streak: streakFor(mem.current, done.size) };
    cur.current = nd;
    setData(nd);
  }, [schedule]);

  const toggle = useCallback((t: Task) => {
    const d = cur.current;
    if (!d) return;
    const has = d.done.has(t.id);
    if (!has && !isUnlocked(t, nowRef.current, d.done)) return;
    const next = new Set(d.done);
    if (has) next.delete(t.id); else next.add(t.id);
    commit({ done: next });
  }, [commit]);

  const saveTask = useCallback((f: TaskForm, base: Task | null) => {
    const d = cur.current;
    if (!d) return;
    const nt = buildTask(f, base, d.tasks);
    commit({ tasks: sortTasks(base ? d.tasks.map((x) => (x.id === base.id ? nt : x)) : [...d.tasks, nt]) });
  }, [commit]);

  // Task hatao. true = ye task done tha (Undo ke liye yaad rakho)
  const removeTask = useCallback((t: Task) => {
    const d = cur.current;
    if (!d) return false;
    const wasDone = d.done.has(t.id);
    const done = new Set(d.done);
    done.delete(t.id);
    commit({ tasks: d.tasks.filter((x) => x.id !== t.id), done: wasDone ? done : undefined });
    return wasDone;
  }, [commit]);

  const restoreTask = useCallback((t: Task, wasDone: boolean) => {
    const d = cur.current;
    if (!d) return;
    commit({ tasks: sortTasks([...d.tasks.filter((x) => x.id !== t.id), t]), done: wasDone ? new Set(d.done).add(t.id) : undefined });
  }, [commit]);

  const setPriority = useCallback((t: Task, p: string) => {
    const d = cur.current;
    if (!d) return;
    commit({ tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, priority: p, updatedAt: Date.now() } : x)) });
  }, [commit]);

  const markPending = useCallback((t: Task) => {
    const d = cur.current;
    if (!d) return;
    const done = new Set(d.done);
    done.delete(t.id);
    commit({ done });
  }, [commit]);

  return {
    ready: data !== null && nowMin !== null, tasks: data?.tasks ?? [], done: data?.done ?? new Set<number>(), streak: data?.streak ?? 0, nowMin: nowMin ?? 0,
    toggle, saveTask, removeTask, restoreTask, setPriority, markPending,
  };
}

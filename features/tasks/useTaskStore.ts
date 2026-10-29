"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { KEYS, type Mem, type Task, isUnlocked, loadDone, loadTasks, nowMinutes, streakFor, today, writeDone } from "./model";

type Data = { tasks: Task[]; done: Set<number>; streak: number };

// Tasks ka data: server se aaya `initial` (user_task_data) ko memory me rakhta hai,
// badlav par 1.2 second baad /api/task-sync par poora data wapas save karta hai (purane page jaisa).
export function useTaskStore(initial: Mem) {
  const mem = useRef<Mem>({ ...initial });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
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
    setData({ tasks: list, done, streak: streakFor(mem.current, done.size) });
    setNowMin(nowMinutes());
    const iv = setInterval(() => setNowMin(nowMinutes()), 30000);
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

  const toggle = useCallback((t: Task) => {
    if (!data || nowMin === null) return;
    const has = data.done.has(t.id);
    if (!has && !isUnlocked(t, nowMin, data.done)) return;
    const next = new Set(data.done);
    if (has) next.delete(t.id); else next.add(t.id);
    writeDone(mem.current, today(), Array.from(next));
    schedule();
    setData({ ...data, done: next, streak: streakFor(mem.current, next.size) });
  }, [data, nowMin, schedule]);

  return { ready: data !== null && nowMin !== null, tasks: data?.tasks ?? [], done: data?.done ?? new Set<number>(), streak: data?.streak ?? 0, nowMin: nowMin ?? 0, toggle };
}

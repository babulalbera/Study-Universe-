// Task page ke progress ka hisaab (roz kam se kam 1 task complete = 1 din). Browser mein chalta hai (user ka apna "aaj").
export type ApiData = {
  loggedIn: boolean; name?: string; role?: string; tasks?: number;
  done?: { date: string; count: number } | null; hist?: Record<string, number>;
};
export type Progress = { total: number; done: number; streak: number; pct: number };

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DEFAULT_TOTAL = 24;

export function computeProgress(total: number, doneRaw: { date: string; count: number } | null | undefined, hist: Record<string, number> | undefined): Progress {
  const today = ymd(new Date());
  const done = doneRaw && doneRaw.date === today ? doneRaw.count : 0;
  const h: Record<string, number> = { ...(hist ?? {}), [today]: done };
  const day = new Date();
  if (!h[ymd(day)]) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (h[ymd(day)] > 0) { streak++; day.setDate(day.getDate() - 1); }
  return { total, done, streak, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function progressFromApi(d: ApiData): Progress {
  return computeProgress(d.tasks ?? DEFAULT_TOTAL, d.done, d.hist);
}

// Login nahi: Task page ka data isi phone ki localStorage mein hota hai
export function progressFromLocal(): Progress {
  const read = <T,>(k: string): T | null => {
    try { return JSON.parse(localStorage.getItem(`studyUniverse.${k}.v1`) ?? "null") as T | null; } catch { return null; }
  };
  const tasks = read<unknown[]>("tasks");
  const done = read<{ date?: string; ids?: unknown[] }>("done");
  return computeProgress(
    Array.isArray(tasks) ? tasks.length : DEFAULT_TOTAL,
    done && typeof done.date === "string" && Array.isArray(done.ids) ? { date: done.date, count: done.ids.length } : null,
    read<Record<string, number>>("hist") ?? undefined,
  );
}

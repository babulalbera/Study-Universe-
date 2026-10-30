// Study Dashboard ka hisaab. Sirf asli data se: Task page ka data (done, hist, log) + user ke goals.
// Sab kuch browser mein (user ke apne "aaj" ke hisaab se) chalta hai.
export type MiniTask = { id: number | string; start: number; end: number; title: string; type: string; subject?: string };
export type DayLog = { n: number; m: number; s?: Record<string, number> };
export type StudyInput = {
  tasks: MiniTask[];
  done: { date: string; ids: (number | string)[] } | null;
  hist: Record<string, number>;
  log: Record<string, DayLog>;
};
export type Goal = {
  id: string; title: string; period: "daily" | "weekly" | "monthly"; metric: "tasks" | "minutes";
  target: number; is_active: boolean; created_at: string;
};

const STUDY_TYPES = new Set(["study", "revision"]);

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7)); // Somvar se
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const fromYmd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

export function minutesOf(t: MiniTask): number {
  let d = t.end - t.start;
  if (d <= 0) d += 1440;
  return d;
}

export function fmtMin(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} ghanta ${r} min` : `${h} ghanta`;
}

// Aaj ke liye live (done ids + tasks), beete dino ke liye saved hist/log
export function dayStats(inp: StudyInput, date: Date, now: Date): { n: number; m: number } {
  const key = ymd(date);
  if (key === ymd(now)) {
    if (!inp.done || inp.done.date !== key) return { n: 0, m: 0 };
    const ids = new Set(inp.done.ids.map(String));
    let m = 0;
    for (const t of inp.tasks) if (ids.has(String(t.id)) && STUDY_TYPES.has(t.type)) m += minutesOf(t);
    return { n: ids.size, m };
  }
  return { n: inp.hist[key] ?? inp.log[key]?.n ?? 0, m: inp.log[key]?.m ?? 0 };
}

export function rangeStats(inp: StudyInput, from: Date, to: Date, now: Date) {
  const days: { date: string; n: number; m: number }[] = [];
  let n = 0, m = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const s = dayStats(inp, d, now);
    days.push({ date: ymd(d), ...s });
    n += s.n; m += s.m;
  }
  return { n, m, days };
}

export function streaks(inp: StudyInput, now: Date): { current: number; longest: number } {
  const dates = new Set<string>([...Object.keys(inp.hist), ...Object.keys(inp.log)]);
  const today = ymd(now);
  if (inp.done) dates.add(inp.done.date);
  const has = (d: Date) => dayStats(inp, d, now).n > 0;
  let current = 0;
  let d = has(now) ? now : addDays(now, -1);
  while (has(d)) { current++; d = addDays(d, -1); }
  // sabse lambi streak: sorted dates par ek baar
  const sorted = [...dates].filter((k) => k <= today && has(fromYmd(k))).sort();
  let longest = 0, run = 0, prev: Date | null = null;
  for (const k of sorted) {
    const cur = fromYmd(k);
    run = prev && ymd(addDays(prev, 1)) === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  return { current, longest: Math.max(longest, current) };
}

export function totalDone(inp: StudyInput, now: Date): number {
  const today = ymd(now);
  let n = 0;
  for (const [k, v] of Object.entries(inp.hist)) if (k !== today) n += v;
  return n + dayStats(inp, now, now).n;
}

// Pichhle `days` dino mein subject-wise padhai (minute)
export function subjectMinutes(inp: StudyInput, now: Date, days = 30): [string, number][] {
  const out: Record<string, number> = {};
  const today = ymd(now);
  for (let i = 1; i < days; i++) {
    const s = inp.log[ymd(addDays(now, -i))]?.s;
    if (s) for (const [k, v] of Object.entries(s)) out[k] = (out[k] ?? 0) + v;
  }
  if (inp.done && inp.done.date === today) {
    const ids = new Set(inp.done.ids.map(String));
    for (const t of inp.tasks) {
      if (ids.has(String(t.id)) && STUDY_TYPES.has(t.type)) { const k = subjectOf(t); out[k] = (out[k] ?? 0) + minutesOf(t); }
    }
  }
  return Object.entries(out).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
}

// Task page ke saved log wala hi hisaab (features/tasks/model.ts ke `subj` ke saath same rakho)
export function subjectOf(t: { subject?: string; title?: string }): string {
  if (t.subject && t.subject.trim()) return t.subject.trim().slice(0, 30);
  const x = String(t.title ?? "").toUpperCase();
  if (/MATH|GANIT/.test(x)) return "Maths";
  if (/ENGLISH/.test(x)) return "English";
  if (/HINDI/.test(x)) return "Hindi";
  if (/REASON/.test(x)) return "Reasoning";
  if (/(^|[^A-Z])GS([^A-Z]|$)|CURRENT|(^|[^A-Z])GK([^A-Z]|$)|POLITY|HISTORY|GEOGRAPHY/.test(x)) return "GS";
  if (/SCIENCE/.test(x)) return "Science";
  if (/FITNESS|EXERCISE/.test(x)) return "Fitness";
  return "Other";
}

function periodStart(period: Goal["period"], d: Date): Date {
  return period === "daily" ? d : period === "weekly" ? startOfWeek(d) : startOfMonth(d);
}
function periodEnd(period: Goal["period"], start: Date): Date {
  return period === "daily" ? start : period === "weekly" ? addDays(start, 6) : new Date(start.getFullYear(), start.getMonth() + 1, 0);
}
function periodValue(inp: StudyInput, goal: Goal, start: Date, now: Date): number {
  const end = periodEnd(goal.period, start);
  const last = end > now ? now : end;
  const r = rangeStats(inp, start, last, now);
  return goal.metric === "tasks" ? r.n : r.m;
}

// Goal ki abhi ki progress + kitni baar poora hua (goal banne ke din se)
export function goalProgress(goal: Goal, inp: StudyInput, now: Date): { value: number; pct: number; reached: boolean; completedCount: number } {
  const startNow = periodStart(goal.period, now);
  const value = periodValue(inp, goal, startNow, now);
  const created = new Date(goal.created_at);
  let completedCount = 0;
  let s = periodStart(goal.period, new Date(created.getFullYear(), created.getMonth(), created.getDate()));
  let guard = 0;
  while (s <= startNow && guard++ < 800) {
    if (periodValue(inp, goal, s, now) >= goal.target) completedCount++;
    s = goal.period === "daily" ? addDays(s, 1) : goal.period === "weekly" ? addDays(s, 7) : new Date(s.getFullYear(), s.getMonth() + 1, 1);
  }
  return { value, pct: Math.min(100, Math.round((value / goal.target) * 100)), reached: value >= goal.target, completedCount };
}

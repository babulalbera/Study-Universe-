import { DEFAULT_TASKS } from "./default-tasks";

// Tasks ka data-model. Storage ki keys (studyUniverse.*) purane Tasks page jaisi hi hain,
// isliye purana data, streak aur Profile ke stats waise hi chalte hain.
export type Task = {
  id: number;
  title: string;
  titleHi: string;
  start: number; // din ke minute (330 = 05:30)
  end: number;
  timeLabel: string;
  duration: string;
  type: string;
  subject?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
  priority?: string;
  color?: string;
  photo?: string;
  date?: string;
  description?: string;
  reminder?: string;
  completed?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

export type Filter = "all" | "pending" | "done";
export type Mem = Record<string, string>;

export const KEYS = {
  tasks: "studyUniverse.tasks.v1",
  done: "studyUniverse.done.v1",
  hist: "studyUniverse.hist.v1",
  log: "studyUniverse.log.v1",
} as const;

const two = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
export const today = () => ymd(new Date());
export const hm = (m: number) => { const x = m % 1440; return `${two(Math.floor(x / 60))}:${two(x % 60)}`; };
export const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

// 12 ghante wala time: 14:05 -> "02:05 PM"
export function fmt12(m: number) {
  const h = Math.floor(m / 60) % 24;
  const mi = m % 60;
  return `${two(h === 0 ? 12 : h > 12 ? h - 12 : h)}:${two(mi)} ${h >= 12 ? "PM" : "AM"}`;
}

// "2 ghante 5 min" / "38 min" (khatam ho gaya to null)
export function timeLeft(end: number, now: number) {
  const n = end - now;
  if (n <= 0) return null;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h > 0 ? `${h} ghante ${m} min` : `${m} min`;
}

export function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

// Kam fields wale task me baaki default fields bhar do
function fullTask(t: Task, now: number): Task {
  const d: Partial<Task> = {
    subject: t.titleHi || "", startTime: hm(t.start), endTime: hm(t.end), date: "", description: "", priority: "medium",
    category: t.type || "study", color: "", reminder: "", completed: false, createdAt: now, updatedAt: now,
  };
  const o = { ...t } as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) if (o[k] === undefined || o[k] === null) o[k] = v;
  return o as Task;
}

// Saved task list (na ho to 24 default). missing=true matlab pehli baar: ise save karna padega.
export function loadTasks(mem: Mem, now: number): { list: Task[]; missing: boolean } {
  const sv = parseJSON<unknown>(mem[KEYS.tasks], null);
  const base: unknown[] = Array.isArray(sv) ? sv : DEFAULT_TASKS;
  const list = base
    .filter((t): t is Task => !!t && typeof t === "object" && typeof (t as Task).id === "number")
    .map((t) => fullTask(t, now));
  return { list, missing: !Array.isArray(sv) };
}

export function loadDone(mem: Mem): Set<number> {
  const v = parseJSON<{ date?: string; ids?: unknown } | null>(mem[KEYS.done], null);
  return new Set(v && v.date === today() && Array.isArray(v.ids) ? (v.ids as number[]) : []);
}

const isToday = (t: Task) => !t.date || t.date === today();
export const countToday = (list: Task[]) => list.filter(isToday).length;
export const todayTasks = (list: Task[]) => list.filter(isToday).sort((a, b) => a.start - b.start || a.id - b.id);

// Task kab "Complete" ho sakta hai: end ho gaya, ya aakhri task (SLEEP) 10:30 PM ke baad, ya pehle se done
export const isUnlocked = (t: Task, now: number, done: Set<number>) => now >= t.end || (t.id === 24 && now >= 1350) || done.has(t.id);

/* ---------- roz ka hisaab (Profile dashboard isi se bante hain) ---------- */
type Log = Record<string, { n: number; m: number; s: Record<string, number> }>;

function subj(t: Task) {
  if (t.subject && String(t.subject).trim()) return String(t.subject).trim().slice(0, 30);
  const x = String(t.title || "").toUpperCase();
  if (/MATH|GANIT/.test(x)) return "Maths";
  if (/ENGLISH/.test(x)) return "English";
  if (/HINDI/.test(x)) return "Hindi";
  if (/REASON/.test(x)) return "Reasoning";
  if (/(^|[^A-Z])GS([^A-Z]|$)|CURRENT|(^|[^A-Z])GK([^A-Z]|$)|POLITY|HISTORY|GEOGRAPHY/.test(x)) return "GS";
  if (/SCIENCE/.test(x)) return "Science";
  if (/FITNESS|EXERCISE/.test(x)) return "Fitness";
  return "Other";
}

const trim400 = <T extends Record<string, unknown>>(o: T) => {
  const ks = Object.keys(o).sort();
  while (ks.length > 400) delete o[ks.shift() as string];
};

// done set badalne par: done key + hist (din me kitne task) + log (minute, subject-wise) likho
export function writeDone(mem: Mem, date: string, ids: number[]) {
  mem[KEYS.done] = JSON.stringify({ date, ids });
  const h = parseJSON<Record<string, number>>(mem[KEYS.hist], {});
  h[date] = ids.length;
  trim400(h);
  mem[KEYS.hist] = JSON.stringify(h);

  const ts = parseJSON<Task[]>(mem[KEYS.tasks], []);
  const set = new Set(ids.map(String));
  let n = 0, m = 0;
  const s: Record<string, number> = {};
  for (const t of ts) {
    if (!set.has(String(t.id))) continue;
    n++;
    if (t.type === "study" || t.type === "revision") {
      let d = t.end - t.start;
      if (d <= 0) d += 1440;
      m += d;
      s[subj(t)] = (s[subj(t)] || 0) + d;
    }
  }
  const L = parseJSON<Log>(mem[KEYS.log], {});
  L[date] = { n, m, s };
  trim400(L);
  mem[KEYS.log] = JSON.stringify(L);
}

// Lagatar kitne din (aaj ka count abhi ke done set se)
export function streakFor(mem: Mem, doneSize: number) {
  const h = parseJSON<Record<string, number>>(mem[KEYS.hist], {});
  const d = new Date();
  h[ymd(d)] = doneSize;
  if (!h[ymd(d)]) d.setDate(d.getDate() - 1);
  let s = 0;
  while (h[ymd(d)] > 0) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

/* ---------- Add / Edit form ---------- */
export type TaskForm = {
  title: string; subject: string; startTime: string; endTime: string; date: string;
  reminder: string; priority: string; type: string; color: string; description: string;
};

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TYPES: [string, string][] = [["study", "Study"], ["revision", "Revision"], ["break", "Break"], ["fitness", "Fitness"], ["rest", "Rest"]];

// "14:30" -> 870 (galat ho to NaN)
export const toMin = (v: string) => { const a = String(v || "").split(":"); return a.length === 2 ? Number(a[0]) * 60 + Number(a[1]) : NaN; };
export const nextId = (list: Task[]) => list.reduce((m, t) => Math.max(m, t.id), 24) + 1;
export const sortTasks = (l: Task[]) => l.slice().sort((a, b) => a.start - b.start || a.id - b.id);

// Naya task: abhi se agle 30 minute, aaj ki date
export function emptyForm(): TaskForm {
  const n = nowMinutes();
  return { title: "", subject: "", startTime: hm(n), endTime: hm(Math.min(1439, n + 30)), date: today(), reminder: "", priority: "medium", type: "study", color: "", description: "" };
}

export function formFromTask(t: Task): TaskForm {
  return {
    title: t.title, subject: t.subject ?? "", startTime: t.startTime || hm(t.start), endTime: t.endTime || hm(t.end), date: t.date ?? "",
    reminder: t.reminder ?? "", priority: t.priority || "medium", type: t.type || "study", color: t.color ?? "", description: t.description ?? "",
  };
}

// "" = theek hai, warna error ka message
export function validateForm(f: TaskForm): string {
  const s = toMin(f.startTime), e = toMin(f.endTime);
  if (!f.title.trim()) return "Task name likho.";
  if (Number.isNaN(s) || Number.isNaN(e)) return "Start aur End time sahi bharo.";
  if (e <= s) return "End time, Start se baad ka hona chahiye.";
  return "";
}

// Form se task banao (edit me purane task ke baaki fields bache rehte hain)
export function buildTask(f: TaskForm, base: Task | null, list: Task[]): Task {
  const s = toMin(f.startTime), e = toMin(f.endTime), d = e - s, now = Date.now();
  const subject = f.subject.trim();
  const patch: Task = {
    id: base ? base.id : nextId(list), title: f.title.trim().toUpperCase(), titleHi: subject || f.type, subject,
    start: s, end: e, startTime: f.startTime, endTime: f.endTime, timeLabel: `${f.startTime} - ${f.endTime}`,
    duration: d >= 60 && d % 60 === 0 ? `${d / 60} hr` : `${d} min`,
    type: f.type, category: subject || f.type, priority: f.priority, color: f.color, photo: base?.photo ?? "",
    date: f.date, description: f.description.trim(), reminder: f.reminder,
    completed: base ? base.completed : false, createdAt: base?.createdAt ?? now, updatedAt: now,
  };
  return base ? { ...base, ...patch } : patch;
}

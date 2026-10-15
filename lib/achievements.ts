// Badges: sirf asli activity se. Koi nakli unlock nahi.
export type Attempt = { submitted_at: string; pct: number };
export type Badge = {
  key: string; icon: string; title: string; condition: string;
  earned: boolean; date?: string; progress?: { value: number; target: number };
};
export type Bests = { bestTestPct: number | null; longestStreak: number; mostTasksDay: number; mostMinutesDay: number; totalTasks: number };

const dayMs = 86_400_000;
const utc = (k: string) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const isoDay = (iso: string) => iso.slice(0, 10);

export function computeBadges(
  hist: Record<string, number>,
  log: Record<string, { n: number; m: number }>,
  attempts: Attempt[],
): { badges: Badge[]; bests: Bests } {
  const days = Object.keys(hist).filter((k) => hist[k] > 0).sort();

  // streak runs
  let longest = 0, run = 0, prev = "";
  const reach: Record<number, string> = {};
  for (const k of days) {
    run = prev && utc(k) - utc(prev) === dayMs ? run + 1 : 1;
    prev = k;
    longest = Math.max(longest, run);
    for (const t of [3, 7, 30]) if (run === t && !reach[t]) reach[t] = k;
  }

  // cumulative tasks
  let total = 0;
  const cumDate: Record<number, string> = {};
  for (const k of days) {
    total += hist[k];
    for (const t of [1, 100, 500]) if (total >= t && !cumDate[t]) cumDate[t] = k;
  }

  const sorted = [...attempts].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
  const firstWhere = (f: (a: Attempt) => boolean) => sorted.find(f)?.submitted_at;
  const fifth = sorted[4]?.submitted_at;

  const mk = (key: string, icon: string, title: string, condition: string, date: string | undefined, value: number, target: number): Badge => ({
    key, icon, title, condition, earned: Boolean(date), date: date ? isoDay(date) : undefined,
    progress: date ? undefined : { value: Math.min(value, target), target },
  });

  const badges: Badge[] = [
    mk("first-task", "🌱", "Pehla Task", "1 Task complete karo", cumDate[1], total, 1),
    mk("streak-3", "🔥", "3-Din Streak", "Lagatar 3 din kam se kam 1 Task", reach[3], longest, 3),
    mk("streak-7", "⚡", "7-Din Streak", "Lagatar 7 din kam se kam 1 Task", reach[7], longest, 7),
    mk("streak-30", "👑", "30-Din Streak", "Lagatar 30 din kam se kam 1 Task", reach[30], longest, 30),
    mk("tasks-100", "✅", "100 Tasks", "Kul 100 Tasks complete karo", cumDate[100], total, 100),
    mk("tasks-500", "🏆", "500 Tasks", "Kul 500 Tasks complete karo", cumDate[500], total, 500),
    mk("first-test", "📝", "Pehla Test", "Ek Mock Test submit karo", sorted[0]?.submitted_at, sorted.length, 1),
    mk("tests-5", "📚", "5 Tests", "5 Mock Tests submit karo", fifth, sorted.length, 5),
    mk("score-80", "🎯", "80% Score", "Kisi Test mein 80% ya zyada lao", firstWhere((a) => a.pct >= 80), Math.round(Math.max(0, ...sorted.map((a) => a.pct))), 80),
    mk("score-100", "💯", "Perfect Score", "Kisi Test mein 100% lao", firstWhere((a) => a.pct >= 100), Math.round(Math.max(0, ...sorted.map((a) => a.pct))), 100),
  ];

  const bests: Bests = {
    bestTestPct: sorted.length ? Math.max(...sorted.map((a) => a.pct)) : null,
    longestStreak: longest,
    mostTasksDay: days.length ? Math.max(...days.map((k) => hist[k])) : 0,
    mostMinutesDay: Math.max(0, ...Object.values(log).map((l) => l.m)),
    totalTasks: total,
  };
  return { badges, bests };
}

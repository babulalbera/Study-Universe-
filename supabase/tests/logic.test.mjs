// Chalane ke liye: node --experimental-strip-types --test supabase/tests/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { dayStats, streaks, goalProgress, subjectMinutes, totalDone, fmtMin } from "../../lib/study-stats.ts";
import { computeBadges } from "../../lib/achievements.ts";

const now = new Date(2026, 9, 11, 15, 0); // 11 Oct 2026
const tasks = [
  { id: 1, start: 330, end: 345, title: "WAKE UP", type: "rest" },
  { id: 4, start: 420, end: 510, title: "MATHS PRACTICE + PYQ", type: "study" },
  { id: 5, start: 510, end: 555, title: "HINDI GRAMMAR", type: "study" },
  { id: 9, start: 600, end: 660, title: "Mera Topic", type: "revision", subject: "Polity" },
];
const inp = {
  tasks, done: { date: "2026-10-11", ids: [1, 4, 5] },
  hist: { "2026-10-07": 2, "2026-10-08": 1, "2026-10-09": 3, "2026-10-10": 2, "2026-10-11": 3 },
  log: { "2026-10-10": { n: 2, m: 100, s: { Maths: 60, Hindi: 40 } } },
};

test("aaj: done aur study minute (rest ginti mein nahi)", () => {
  assert.deepEqual(dayStats(inp, now, now), { n: 3, m: 135 });
});
test("beeta din: hist/log se", () => {
  assert.deepEqual(dayStats(inp, new Date(2026, 9, 10), now), { n: 2, m: 100 });
});
test("streak: 7-11 Oct lagatar = 5", () => {
  assert.equal(streaks(inp, now).current, 5);
});
test("streak toot-ti hai: 11 Oct khali, 10 se 9... ", () => {
  const i2 = { ...inp, done: { date: "2026-10-11", ids: [] } };
  assert.equal(streaks(i2, now).current, 4);
});
test("kul tasks", () => assert.equal(totalDone(inp, now), 11));
test("subject-wise", () => {
  const s = Object.fromEntries(subjectMinutes(inp, now));
  assert.equal(s.Maths, 60 + 90);
  assert.equal(s.Hindi, 40 + 45);
});
test("daily goal minutes poora", () => {
  const g = { id: "g", title: "x", period: "daily", metric: "minutes", target: 120, is_active: true, created_at: "2026-10-10T08:00:00Z" };
  const p = goalProgress(g, inp, now);
  assert.equal(p.value, 135); assert.equal(p.reached, true); assert.equal(p.pct, 100);
  assert.equal(p.completedCount, 1); // sirf 11 Oct (10 Oct: 100 min < 120)
});
test("weekly tasks goal", () => {
  const g = { id: "g", title: "x", period: "weekly", metric: "tasks", target: 10, is_active: true, created_at: "2026-10-05T00:00:00Z" };
  const p = goalProgress(g, inp, now);
  assert.equal(p.value, 11); assert.equal(p.completedCount, 1);
});
test("fmtMin", () => { assert.equal(fmtMin(45), "45 min"); assert.equal(fmtMin(135), "2 ghanta 15 min"); });

test("badges: sirf asli activity", () => {
  const empty = computeBadges({}, {}, []);
  assert.equal(empty.badges.filter((b) => b.earned).length, 0);
  const hist = {}; for (let i = 1; i <= 7; i++) hist[`2026-09-${String(i).padStart(2, "0")}`] = 15;
  const r = computeBadges(hist, {}, [{ submitted_at: "2026-09-02T10:00:00Z", pct: 85 }]);
  const get = (k) => r.badges.find((b) => b.key === k);
  assert.equal(get("streak-7").earned, true); assert.equal(get("streak-7").date, "2026-09-07");
  assert.equal(get("tasks-100").earned, true); assert.equal(get("tasks-100").date, "2026-09-07");
  assert.equal(get("first-test").date, "2026-09-02"); assert.equal(get("score-80").earned, true);
  assert.equal(get("score-100").earned, false); assert.equal(get("streak-30").progress.value, 7);
});

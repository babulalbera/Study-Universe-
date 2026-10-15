"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays, dayStats, fmtMin, fromYmd, goalProgress, rangeStats, startOfMonth, startOfWeek, streaks, subjectMinutes, totalDone,
  type Goal, type StudyInput,
} from "@/lib/study-stats";
import { METRICS, PERIODS } from "@/lib/profile-options";
import { deleteGoal, saveGoal, toggleGoal } from "./actions";
import type { FormState } from "../types";

type Props = { input: StudyInput; goals: Goal[]; dailyGoal: number; examDate: string | null; targetExam: string };
const DAY = ["Som", "Mang", "Budh", "Guru", "Shuk", "Shani", "Ravi"];
const pctOf = (v: number, t: number) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);
const diffText = (a: number, b: number, unit: string) => (a === b ? "pichhle hafte ke barabar" : `${a > b ? "+" : "-"}${Math.abs(a - b)} ${unit} pichhle hafte se ${a > b ? "zyada" : "kam"}`);

function Bar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="pd-bar">
      <div className="pd-mlabel"><span>{label}</span><b>{value}</b></div>
      <div className="pd-track"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function GoalForm({ goal }: { goal?: Goal }) {
  const [st, action, pending] = useActionState<FormState, FormData>(saveGoal, {});
  const [k, setK] = useState(0);
  useEffect(() => { if (st.message && !goal) setK((x) => x + 1); }, [st, goal]);
  return (
    <form key={k} action={action} className="pd-form" noValidate>
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <label className="su-field"><span>Goal ka naam</span><input name="title" defaultValue={goal?.title} maxLength={80} required placeholder="Jaise: Roz 2 ghante Maths" /></label>
      <div className="pd-two">
        <label className="su-field"><span>Kitne samay ka</span>
          <select name="period" defaultValue={goal?.period ?? "daily"}>{Object.entries(PERIODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className="su-field"><span>Kya ginna hai</span>
          <select name="metric" defaultValue={goal?.metric ?? "minutes"}>{Object.entries(METRICS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
      </div>
      <label className="su-field"><span>Target (ank)</span><input name="target" type="number" min={1} max={100000} defaultValue={goal?.target ?? 120} required /></label>
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "Ruko…" : goal ? "Goal save karo" : "➕ Goal jodo"}</button>
      {st.error && <p role="alert" className="pd-warn">{st.error}</p>}
      {st.message && <p role="status" className="pd-ok">{st.message}</p>}
    </form>
  );
}

export default function StudySection({ input, goals, dailyGoal, examDate, targetExam }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const v = useMemo(() => {
    if (!now) return null;
    const today = dayStats(input, now, now);
    const ws = startOfWeek(now), lws = addDays(ws, -7);
    const week = rangeStats(input, ws, addDays(ws, 6), now);
    const last = rangeStats(input, lws, addDays(lws, 6), now);
    const ms = startOfMonth(now), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const month = rangeStats(input, ms, new Date(now.getFullYear(), now.getMonth(), dim), now);
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const left = examDate ? Math.round((fromYmd(examDate).getTime() - base.getTime()) / 86_400_000) : null;
    return { today, week, last, month, dim, st: streaks(input, now), total: totalDone(input, now), subs: subjectMinutes(input, now, 30), left };
  }, [now, input, examDate]);

  if (!now || !v) return <section id="study" className="pd-card"><h2 className="pd-h">📈 Study Dashboard</h2><p className="pd-dim">Load ho raha hai…</p></section>;

  const totalToday = input.tasks.length;
  const pending = Math.max(0, totalToday - v.today.n);
  const maxN = Math.max(1, ...v.week.days.map((d) => d.n));
  const maxS = Math.max(1, ...v.subs.map(([, m]) => m));
  const active = goals.filter((g) => g.is_active);
  const paused = goals.filter((g) => !g.is_active);

  return (
    <section id="study" className="pd-card">
      <h2 className="pd-h">📈 Study Dashboard</h2>
      {totalToday === 0 && (
        <p className="pd-note">Abhi Task page ka data nahi mila. <Link href="/tasks">Task page kholo</Link> aur kuch Tasks complete karo, tab yahan asli aankde dikhenge.</p>
      )}

      <div className="pd-stats">
        <div><b>{v.today.n}<small>/{totalToday}</small></b><span>Aaj ke Tasks pure</span><em>{pending} baaki</em></div>
        <div><b>{fmtMin(v.today.m)}</b><span>Aaj ka study time</span><em>pure kiye study/revision Tasks se</em></div>
        <div><b>{v.st.current} 🔥</b><span>Streak (din)</span><em>sabse lambi: {v.st.longest}</em></div>
        <div><b>{v.total}</b><span>Kul Tasks pure</span><em>Task page ke record se</em></div>
      </div>

      <h3 className="pd-h3">Study goal progress <small>(roz ka goal {fmtMin(dailyGoal)})</small></h3>
      <Bar label="Aaj" value={`${fmtMin(v.today.m)} / ${fmtMin(dailyGoal)}`} pct={pctOf(v.today.m, dailyGoal)} />
      <Bar label="Is hafte (Som se)" value={`${fmtMin(v.week.m)} / ${fmtMin(dailyGoal * 7)}`} pct={pctOf(v.week.m, dailyGoal * 7)} />
      <Bar label="Is mahine" value={`${fmtMin(v.month.m)} / ${fmtMin(dailyGoal * v.dim)}`} pct={pctOf(v.month.m, dailyGoal * v.dim)} />

      <h3 className="pd-h3">Hafte ki activity <small>(pure kiye Tasks)</small></h3>
      <div className="pd-chart" role="img" aria-label="Is hafte roz pure kiye gaye Tasks">
        {v.week.days.map((d, i) => (
          <div key={d.date} className="pd-col" title={`${d.n} Tasks, ${fmtMin(d.m)}`}>
            <b>{d.n}</b>
            <div className="pd-colbar"><i style={{ height: `${Math.max(d.n ? 8 : 2, (d.n / maxN) * 100)}%` }} /></div>
            <span>{DAY[i]}</span>
          </div>
        ))}
      </div>
      <p className="pd-dim">
        Is hafte: <b>{v.week.n}</b> Tasks, {fmtMin(v.week.m)} • Pichhle hafte: <b>{v.last.n}</b> Tasks, {fmtMin(v.last.m)}<br />
        {diffText(v.week.n, v.last.n, "Tasks")} • {diffText(v.week.m, v.last.m, "min")}
      </p>

      <h3 className="pd-h3">Vishay-wise padhai <small>(pichhle 30 din)</small></h3>
      {v.subs.length === 0
        ? <p className="pd-dim">Abhi vishay-wise record nahi hai. Study/revision Tasks complete karte hi yahan dikhega (record Task page se banta hai, purane din ka nahi).</p>
        : v.subs.map(([name, m]) => <Bar key={name} label={name} value={fmtMin(m)} pct={Math.round((m / maxS) * 100)} />)}

      <h3 className="pd-h3">Pariksha countdown</h3>
      {v.left === null
        ? <p className="pd-dim">Pariksha ki tareekh set nahi hai. <a href="#profile">Profile edit karke</a> tareekh daalo.</p>
        : v.left > 0
          ? <p className="pd-count"><b>{v.left}</b> din baaki{targetExam ? ` — ${targetExam}` : ""}</p>
          : v.left === 0 ? <p className="pd-count"><b>Aaj</b> pariksha hai{targetExam ? ` — ${targetExam}` : ""}. Best of luck! 🙏</p>
            : <p className="pd-dim">Ye tareekh beet chuki hai ({Math.abs(v.left)} din pehle). Nayi tareekh set karo.</p>}

      <h3 className="pd-h3" id="goals">🎯 Meri Goals</h3>
      {goals.length === 0 && <p className="pd-dim">Abhi koi goal nahi. Neeche se apna pehla goal banao.</p>}
      {active.map((g) => <GoalRow key={g.id} g={g} input={input} now={now} />)}
      {paused.length > 0 && <p className="pd-dim" style={{ marginTop: 10 }}>Roke hue Goals:</p>}
      {paused.map((g) => <GoalRow key={g.id} g={g} input={input} now={now} />)}
      <details className="pd-edit"><summary>➕ Naya Goal banao</summary><GoalForm /></details>
    </section>
  );
}

function GoalRow({ g, input, now }: { g: Goal; input: StudyInput; now: Date }) {
  const p = goalProgress(g, input, now);
  const unit = g.metric === "tasks" ? "Tasks" : "min";
  return (
    <div className={`pd-goal ${g.is_active ? "" : "off"}`}>
      <div className="pd-mlabel"><span>{g.title}</span><b>{p.value}/{g.target} {unit}</b></div>
      <div className="pd-track"><i style={{ width: `${p.pct}%` }} /></div>
      <p className="pd-dim">{PERIODS[g.period]} • {METRICS[g.metric]} • {p.reached ? "✓ Is baar poora" : `${p.pct}%`} • Ab tak {p.completedCount} baar poora hua</p>
      <details className="pd-edit">
        <summary>Badlo / Roko / Hatao</summary>
        <GoalForm goal={g} />
        <div className="pd-row">
          <form action={toggleGoal}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="active" value={g.is_active ? "0" : "1"} /><button className="pbtn pbtn-ghost" type="submit">{g.is_active ? "⏸ Roko" : "▶️ Chalu karo"}</button></form>
          <form action={deleteGoal} onSubmit={(e) => { if (!window.confirm("Goal hatana hai?")) e.preventDefault(); }}><input type="hidden" name="id" value={g.id} /><button className="pbtn pbtn-ghost" type="submit">🗑 Hatao</button></form>
        </div>
      </details>
    </div>
  );
}

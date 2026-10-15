"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, dayStats, rangeStats, startOfWeek, streaks, type StudyInput } from "@/lib/study-stats";
import { IBook, IChart, IChevron, IClipboard, IDoc, IFlame, ITarget } from "./icons";
import { fmtMin } from "@/lib/study-stats";

type Props = { input: StudyInput; dailyGoal: number; mockCount: number };
const pct = (v: number, t: number) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);

// Design: "Study Overview" - 4 kaarde (asli data se)
export default function OverviewSection({ input, dailyGoal, mockCount }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const v = useMemo(() => {
    if (!now) return null;
    const today = dayStats(input, now, now);
    const ws = startOfWeek(now);
    const week = rangeStats(input, ws, addDays(ws, 6), now);
    return { done: today.n, streak: streaks(input, now).current, week: week.m };
  }, [now, input]);

  const total = input.tasks.length;
  const overall = v ? pct(v.week, dailyGoal * 7) : 0;

  return (
    <section id="overview" className="pm-card" aria-label="Study Overview">
      <div className="pm-head">
        <h2 className="pm-title"><IChart size={24} /><span>Study Overview</span></h2>
        <a className="pm-link" href="#study">See Details <IChevron size={14} /></a>
      </div>
      <div className="pm-stats">
        <div className="pm-stat">
          <span className="pm-ic"><IClipboard size={22} /></span>
          <small>Today&apos;s Tasks</small>
          <b>{v ? v.done : "—"} <i>/ {total}</i></b>
          <div className="pm-bar"><u style={{ width: `${v ? pct(v.done, total) : 0}%` }} /></div>
        </div>
        <div className="pm-stat">
          <span className="pm-ic"><IFlame size={22} /></span>
          <small>Study Streak</small>
          <b>{v ? v.streak : "—"} <i>days</i></b>
        </div>
        <div className="pm-stat">
          <span className="pm-ic"><IDoc size={22} /></span>
          <small>Mock Tests</small>
          <b>{mockCount}</b>
        </div>
        <div className="pm-stat">
          <span className="pm-ic"><ITarget size={22} /></span>
          <small>Overall Progress</small>
          <b>{v ? `${overall}%` : "—"}</b>
          <div className="pm-bar"><u style={{ width: `${overall}%` }} /></div>
          <em>is hafte ka goal ({v ? fmtMin(v.week) : "—"} / {fmtMin(dailyGoal * 7)})</em>
        </div>
      </div>
      {total === 0 && (
        <p className="pm-hint"><IBook size={16} /> Abhi Task data nahi mila. <Link href="/tasks">Task page kholo</Link> aur Tasks complete karo.</p>
      )}
    </section>
  );
}

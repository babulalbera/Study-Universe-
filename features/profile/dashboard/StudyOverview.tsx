"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, dayStats, rangeStats, streaks, type StudyInput } from "@/lib/study-stats";
import { Icon } from "./icons";

export default function StudyOverview({ input, mockCount }: { input: StudyInput; mockCount: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const v = useMemo(() => {
    if (!now) return null;
    const total = input.tasks.length;
    const today = dayStats(input, now, now);
    const week = rangeStats(input, addDays(now, -6), now, now);   // pichhle 7 din (aaj tak)
    const prev = rangeStats(input, addDays(now, -13), addDays(now, -7), now); // usse pehle ke 7 din
    const pctOf = (n: number) => (total ? Math.min(100, Math.round((n / (total * 7)) * 100)) : 0);
    const overall = pctOf(week.n);
    return {
      done: today.n, total, streak: streaks(input, now).current,
      todayPct: total ? Math.min(100, Math.round((today.n / total) * 100)) : 0,
      overall, delta: overall - pctOf(prev.n),
    };
  }, [now, input]);

  const streakSub = !v ? "" : v.streak === 0 ? "Aaj shuru karo" : v.streak < 7 ? "Keep going 🔥" : "Zabardast! 🔥";
  const overallSub = !v ? "" : v.overall === 0 ? "Shuru karo" : v.overall < 25 ? "Just started" : v.overall < 60 ? "Keep going" : "Great pace";

  return (
    <section id="overview" className="pr-os-wrap">
      <div className="pr-sechd"><span>STUDY OVERVIEW</span><i /><Link href="/tasks" className="pr-seemore">See Details ›</Link></div>
      <div className="pr-os">
        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="check" /></span>
            {v && v.done > 0 ? <span className="pr-chip">+{v.done} today</span> : null}
          </div>
          <p>Today&apos;s Tasks</p>
          <b>{v ? v.done : "—"}<small>/{v ? v.total : "—"}</small></b>
          <em>{v ? `${v.todayPct}% done` : ""}</em>
        </div>

        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="flame" /></span>
            {v && v.done > 0 ? <span className="pr-chip">+1 today</span> : null}
          </div>
          <p>Study Streak</p>
          <b>{v ? v.streak : "—"}<small> days</small></b>
          <em>{streakSub}</em>
        </div>

        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="bars" /></span>
            {mockCount === 0 ? <Link href="/mock-tests" className="pr-chip pr-chip-link">Start now</Link> : null}
          </div>
          <p>Mock Tests</p>
          <b>{mockCount}</b>
          <em>{mockCount === 0 ? "Not started" : `${mockCount} attempted`}</em>
        </div>

        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="target" /></span>
            {v && v.delta !== 0 ? <span className={`pr-chip${v.delta < 0 ? " neg" : ""}`}>{v.delta > 0 ? "+" : ""}{v.delta}% week</span> : null}
          </div>
          <p>Overall</p>
          <b>{v ? `${v.overall}%` : "—"}</b>
          <em>{overallSub}</em>
        </div>
      </div>
      <p className="pd-dim">Overall = pichhle 7 din me pure kiye Tasks, un dinon ke kul Tasks me se. &quot;week&quot; badge pichhle hafte se tulna dikhata hai. {v && v.total === 0 ? "Abhi Task page ka data nahi mila, /tasks kholo." : ""}</p>
    </section>
  );
}

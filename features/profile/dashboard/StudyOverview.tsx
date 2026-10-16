"use client";
import { useEffect, useMemo, useState } from "react";
import { addDays, dayStats, rangeStats, streaks, type StudyInput } from "@/lib/study-stats";
import { Icon } from "./icons";

export default function StudyOverview({ input, mockCount }: { input: StudyInput; mockCount: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const v = useMemo(() => {
    if (!now) return null;
    const total = input.tasks.length;
    const today = dayStats(input, now, now);
    const week = rangeStats(input, addDays(now, -6), now, now); // pichhle 7 din (aaj tak)
    return {
      done: today.n, total, streak: streaks(input, now).current,
      todayPct: total ? Math.min(100, Math.round((today.n / total) * 100)) : 0,
      overall: total ? Math.min(100, Math.round((week.n / (total * 7)) * 100)) : 0,
    };
  }, [now, input]);

  return (
    <section id="overview" className="ov-sec">
      <div className="ov-head">
        <h2><Icon name="bars" size={24} /> Study Overview</h2>
        <a href="/tasks" className="ov-more">See Details <Icon name="chevron" size={15} /></a>
      </div>
      <div className="ov-cards">
        <div className="ov-stat">
          <span className="ov-ic"><Icon name="check" /></span>
          <p>Today&apos;s Tasks</p>
          <b>{v ? v.done : "—"}<small> / {v ? v.total : "—"}</small></b>
          <div className="ov-bar"><i style={{ width: `${v?.todayPct ?? 0}%` }} /></div>
        </div>
        <div className="ov-stat">
          <span className="ov-ic"><Icon name="flame" /></span>
          <p>Study Streak</p>
          <b>{v ? v.streak : "—"}<small> days</small></b>
        </div>
        <div className="ov-stat">
          <span className="ov-ic"><Icon name="doc" /></span>
          <p>Mock Tests</p>
          <b>{mockCount}</b>
        </div>
        <div className="ov-stat">
          <span className="ov-ic"><Icon name="target" /></span>
          <p>Overall Progress</p>
          <b>{v ? `${v.overall}%` : "—"}</b>
          <div className="ov-bar"><i style={{ width: `${v?.overall ?? 0}%` }} /></div>
        </div>
      </div>
      <p className="pd-dim">Overall Progress = pichhle 7 din mein pure kiye Tasks, un dinon ke kul Tasks mein se. {v && v.total === 0 ? "Abhi Task page ka data nahi mila — /tasks kholo." : ""}</p>
    </section>
  );
}

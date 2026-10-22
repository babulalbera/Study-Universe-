"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, dayStats, rangeStats, streaks, type StudyInput } from "@/lib/study-stats";
import { P, type Lang } from "@/lib/i18n";
import { Icon } from "./icons";

export default function StudyOverview({ input, mockCount, lang }: { input: StudyInput; mockCount: number; lang: Lang }) {
  const t = P[lang].ov;
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

  const streakSub = !v ? "" : v.streak === 0 ? t.streak0 : v.streak < 7 ? t.streak1 : t.streak2;
  const overallSub = !v ? "" : v.overall === 0 ? t.o0 : v.overall < 25 ? t.o1 : v.overall < 60 ? t.o2 : t.o3;

  return (
    <section id="overview" className="pr-os-wrap">
      <div className="pr-sechd"><span>{t.title}</span><i /><Link href="/tasks" className="pr-seemore">{t.details}</Link></div>
      <div className="pr-os">
        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="check" /></span>
            {v && v.done > 0 ? <span className="pr-chip">{t.chipToday(v.done)}</span> : null}
          </div>
          <p>{t.today}</p>
          <b>{v ? v.done : "—"}<small>/{v ? v.total : "—"}</small></b>
          <em>{v ? t.done(v.todayPct) : ""}</em>
        </div>

        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="flame" /></span>
            {v && v.done > 0 ? <span className="pr-chip">{t.chipStreak}</span> : null}
          </div>
          <p>{t.streak}</p>
          <b>{v ? v.streak : "—"}<small>{t.days}</small></b>
          <em>{streakSub}</em>
        </div>

        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="bars" /></span>
            {mockCount === 0 ? <Link href="/mock-tests" className="pr-chip pr-chip-link">{t.startNow}</Link> : null}
          </div>
          <p>{t.mock}</p>
          <b>{mockCount}</b>
          <em>{mockCount === 0 ? t.notStarted : t.attempted(mockCount)}</em>
        </div>

        <div className="pr-oc">
          <div className="pr-oc-top">
            <span className="pr-oc-ic"><Icon name="target" /></span>
            {v && v.delta !== 0 ? <span className={`pr-chip${v.delta < 0 ? " neg" : ""}`}>{t.chipWeek(v.delta)}</span> : null}
          </div>
          <p>{t.overall}</p>
          <b>{v ? `${v.overall}%` : "—"}</b>
          <em>{overallSub}</em>
        </div>
      </div>
      <p className="pd-dim">{t.note} {v && v.total === 0 ? t.noData : ""}</p>
    </section>
  );
}

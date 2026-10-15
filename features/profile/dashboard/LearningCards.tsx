"use client";
import { useEffect, useMemo, useState } from "react";
import { fmtMin, subjectMinutes, type StudyInput } from "@/lib/study-stats";
import { Icon } from "./icons";

const COLORS = ["#B91C1C", "#5B21B6", "#065F46"];

// "My Learning": website mein Courses nahi hain, isliye yahan tumhari asli padhai (vishay-wise, pichhle 30 din) dikhti hai.
export default function LearningCards({ input }: { input: StudyInput }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const subs = useMemo(() => (now ? subjectMinutes(input, now, 30) : []), [now, input]);
  const total = subs.reduce((a, [, m]) => a + m, 0);

  return (
    <section id="mylearning" className="ov-sec">
      <div className="ov-head">
        <h2><Icon name="book" size={26} /> My Learning</h2>
        <a href="#learning" className="ov-more">View All <Icon name="chevron" size={15} /></a>
      </div>
      {subs.length === 0 ? (
        <p className="pd-dim">Abhi vishay-wise padhai ka record nahi hai. Study/revision Tasks complete karte hi yahan tumhare top vishay dikhenge (pichhle 30 din).</p>
      ) : (
        <div className="ov-learn">
          {subs.slice(0, 3).map(([name, m], i) => {
            const pct = total ? Math.round((m / total) * 100) : 0;
            return (
              <div key={name} className="ov-lc">
                <span className="ov-badge" style={{ background: COLORS[i % COLORS.length] }}>{name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "SU"}</span>
                <div className="ov-lbody">
                  <b>{name}</b>
                  <small>{fmtMin(m)} • pichhle 30 din</small>
                  <div className="ov-lrow"><div className="ov-bar"><i style={{ width: `${pct}%` }} /></div><span>{pct}%</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

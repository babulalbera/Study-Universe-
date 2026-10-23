import Link from "next/link";
import type { CSSProperties } from "react";

type Track = { key: string; name: string; tagline: string; subjects: string[]; href: string; cta: string };

const TRACKS: Track[] = [
  { key: "ssc", name: "SSC CGL", tagline: "Tier-wise pakki tayyari", subjects: ["Quant", "Reasoning", "English", "General Awareness"], href: "/mock-tests", cta: "SSC mock test" },
  { key: "gd", name: "Army GD", tagline: "Vardi ki taraf pehla kadam", subjects: ["GK", "General Science", "Maths", "Reasoning"], href: "/courses", cta: "GD courses" },
  { key: "gk", name: "GK & Current Affairs", tagline: "Roz thoda, saal bhar tez", subjects: ["Static GK", "Current Affairs", "History", "Polity"], href: "/books", cta: "Books & PDFs" },
];

export default function ExamTracks() {
  return (
    <section className="rv" aria-labelledby="lp-tracks">
      <div className="sec"><h2 id="lp-tracks">Apna exam chuno</h2><i /></div>
      <div className="lp-tracks">
        {TRACKS.map((t, i) => (
          <Link key={t.key} href={t.href} className="lp-track" style={{ "--k": i } as CSSProperties}>
            <span className="lp-track-no" aria-hidden="true">0{i + 1}</span>
            <h3 className="lp-track-name">{t.name}</h3>
            <p className="lp-track-tag">{t.tagline}</p>
            <ul className="lp-chips">
              {t.subjects.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <span className="lp-track-cta">
              {t.cta}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

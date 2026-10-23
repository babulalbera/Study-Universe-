import Link from "next/link";
import type { CSSProperties } from "react";

const STEPS = [
  { n: "1", title: "Padho", text: "Free courses aur chuni hui books se concept clear karo.", href: "/books", cta: "Books kholo" },
  { n: "2", title: "Practice karo", text: "Real exam pattern ke mock tests do aur apni galtiyan pakdo.", href: "/mock-tests", cta: "Test do" },
  { n: "3", title: "Track karo", text: "Daily task + streak se consistency banao, results se growth dekho.", href: "/tasks", cta: "Task dekho" },
];

export default function HowItWorks() {
  return (
    <section className="rv" aria-labelledby="lp-how">
      <div className="sec"><h2 id="lp-how">Selection ka seedha raasta</h2><i /></div>
      <ol className="lp-steps">
        {STEPS.map((s, i) => (
          <li key={s.n} className="lp-step" style={{ "--k": i } as CSSProperties}>
            <span className="lp-step-n" aria-hidden="true">{s.n}</span>
            <h3 className="lp-step-t">{s.title}</h3>
            <p>{s.text}</p>
            <Link href={s.href} className="lp-step-l">{s.cta} <span aria-hidden="true">→</span></Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

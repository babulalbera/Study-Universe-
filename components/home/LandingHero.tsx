import Image from "next/image";
import type { CSSProperties } from "react";

// Home ka pehla premium screen: headline + Gita line (chota box).
// Server component hai — koi JS nahi, isliye turant dikhta hai.
export default function LandingHero() {
  return (
    <section className="lp-hero rv" aria-labelledby="lp-h1">
      {/* Premium rotating border glow (CSS: LP-GLOW, globals.css me) */}
      <span className="lp-glow" aria-hidden="true" />
      <span className="lp-glow lp-glow-blur" aria-hidden="true" />

      <div className="lp-copy">
        <h1 id="lp-h1" className="lp-h1">
          <span className="w" style={{ "--d": 0 } as CSSProperties}>Preparation</span>{" "}
          <span className="w" style={{ "--d": 1 } as CSSProperties}>jo</span>
          <br />
          <em className="w" style={{ "--d": 2 } as CSSProperties}>selection</em>{" "}
          <span className="w" style={{ "--d": 3 } as CSSProperties}>tak</span>{" "}
          <span className="w" style={{ "--d": 4 } as CSSProperties}>le</span>{" "}
          <span className="w" style={{ "--d": 5 } as CSSProperties}>jaye</span>
        </h1>
        <p className="lp-sub">
          Free courses, best books, exam-pattern mock tests aur daily tasks — sab ek hi jagah. Seedha 0° se shuru karo,
          roz thoda aage badho.
        </p>
        <ul className="lp-trust" aria-label="Highlights">
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>100% Free</li>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Real exam pattern</li>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Daily streak</li>
        </ul>
      </div>

      <div className="lp-visual" aria-hidden="true">
        <div className="lp-orb">
          <span className="lp-orbit"><i /><i /><i /></span>
          <span className="lp-ring lp-ring-a" />
          <span className="lp-ring lp-ring-b" />
          <div className="lp-avatar">
            <Image src="/images/krishna.webp" alt="" width={360} height={480} priority sizes="(max-width:768px) 200px, 300px" />
          </div>
        </div>
      </div>

      <blockquote className="lp-quote">
        <p lang="sa">“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन”</p>
        <footer lang="hi">मेहनत तुम्हारी, सफलता निश्चित है — कान्हा तुम्हारे साथ है</footer>
      </blockquote>
    </section>
  );
}

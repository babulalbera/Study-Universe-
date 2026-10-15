import Link from "next/link";
import type { AttemptRow, OpenAttempt, SubjectStat } from "./queries";

type Props = { submitted: AttemptRow[]; open: OpenAttempt[]; subjects: SubjectStat[]; accuracy: { correct: number; wrong: number } };
const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const r1 = (n: number) => Math.round(n * 10) / 10;

function Trend({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null;
  const W = 300, H = 90, P = 8;
  const x = (i: number) => P + (i * (W - 2 * P)) / (pts.length - 1);
  const y = (v: number) => H - P - (v / 100) * (H - 2 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pd-line" role="img" aria-label="Test scores ka graph (%)">
      {[0, 50, 100].map((g) => <line key={g} x1={P} x2={W - P} y1={y(g)} y2={y(g)} />)}
      <polyline points={pts.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" />
      {pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" />)}
    </svg>
  );
}

export default function TestsSection({ submitted, open, subjects, accuracy }: Props) {
  const done = submitted.length;
  const chrono = [...submitted].reverse().slice(-15);
  const avg = done ? submitted.reduce((a, x) => a + x.pct, 0) / done : 0;
  const best = done ? Math.max(...submitted.map((x) => x.pct)) : 0;
  const attempted = accuracy.correct + accuracy.wrong;
  const acc = attempted ? (accuracy.correct / attempted) * 100 : null;
  let trend = "";
  if (chrono.length >= 4) {
    const half = Math.floor(chrono.length / 2);
    const a = chrono.slice(0, half).reduce((s, x) => s + x.pct, 0) / half;
    const b = chrono.slice(half).reduce((s, x) => s + x.pct, 0) / (chrono.length - half);
    trend = b > a + 1 ? `📈 Score badh raha hai (${r1(a)}% se ${r1(b)}%)` : b < a - 1 ? `📉 Score girta dikh raha hai (${r1(a)}% se ${r1(b)}%)` : "➡️ Score lagbhag same hai";
  }
  const weak = subjects.filter((s) => s.correct + s.wrong >= 3 && s.correct / (s.correct + s.wrong) < 0.6);

  return (
    <section id="tests" className="pd-card">
      <h2 className="pd-h">📝 Mock Tests aur Results</h2>
      <div className="pd-stats">
        <div><b>{done + open.length}</b><span>Tests diye / shuru kiye</span><em>{done} pure • {open.length} adhoore</em></div>
        <div><b>{done ? `${r1(avg)}%` : "—"}</b><span>Average score</span><em>{done ? `sabse achha ${r1(best)}%` : "abhi koi test nahi"}</em></div>
        <div><b>{acc === null ? "—" : `${r1(acc)}%`}</b><span>Accuracy</span><em>{attempted ? `${accuracy.correct} sahi, ${accuracy.wrong} galat` : "jawab dene ke baad"}</em></div>
        <div><b>—</b><span>Rank</span><em>abhi uplabdh nahi</em></div>
      </div>

      {done === 0 && open.length === 0 ? (
        <p className="pd-note">Abhi tumne koi Mock Test nahi diya. <Link href="/mock-tests">Pehla Test do</Link> — result yahan apne aap dikhega.</p>
      ) : (
        <>
          {open.length > 0 && (
            <>
              <h3 className="pd-h3">Adhoore Tests</h3>
              {open.map((o) => (
                <Link key={o.id} href={`/mock-tests/${o.testId}`} className="pd-item"><span>{o.title}</span><em>Jaari rakho →</em></Link>
              ))}
            </>
          )}
          {chrono.length >= 2 && (
            <>
              <h3 className="pd-h3">Score history <small>(pichhle {chrono.length} tests, %)</small></h3>
              <Trend pts={chrono.map((x) => x.pct)} />
              {trend && <p className="pd-dim">{trend}</p>}
            </>
          )}
          {done > 0 && (
            <>
              <h3 className="pd-h3">Pichhle Results</h3>
              {submitted.slice(0, 6).map((a) => (
                <Link key={a.id} href={`/results/${a.id}`} className="pd-item">
                  <span>{a.title}<small>{fmt(a.at)}</small></span><b>{a.score}/{a.total} • {r1(a.pct)}%</b>
                </Link>
              ))}
              <p className="pd-dim"><Link href="/results">Sabhi Results dekho →</Link></p>
            </>
          )}
        </>
      )}

      <h3 className="pd-h3">Vishay-wise sahi / galat</h3>
      {subjects.length === 0
        ? <p className="pd-dim">Vishay-wise record tab banega jab Admin sawalon mein Vishay (subject) bharega aur tum Test doge.</p>
        : (
          <>
            <div className="pd-table" role="table">
              {subjects.map((s) => {
                const n = s.correct + s.wrong;
                return (
                  <div key={s.subject} className="pd-trow" role="row">
                    <span>{s.subject}</span><span className="pd-ok">{s.correct} sahi</span><span className="pd-warn">{s.wrong} galat</span>
                    <span className="pd-dim">{s.skipped} chhode</span><b>{n ? `${Math.round((s.correct / n) * 100)}%` : "—"}</b>
                  </div>
                );
              })}
            </div>
            {weak.length > 0 && <p className="pd-note">Sudhar ki zaroorat: <b>{weak.map((w) => w.subject).join(", ")}</b> (accuracy 60% se kam)</p>}
          </>
        )}
    </section>
  );
}

import Link from "next/link";
import type { AttemptRow, BookLite, OpenAttempt } from "./queries";

type Props = { saved: BookLite[]; recent: (BookLite & { at: string })[]; open: OpenAttempt[]; results: AttemptRow[] };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("hi-IN", { day: "numeric", month: "short" });

function BookRow({ b, note }: { b: BookLite; note?: string }) {
  return (
    <a className="pd-item" href={`/books/${b.id}/open`} target="_blank" rel="noopener noreferrer">
      <span>{b.title}<small>{[b.author, note].filter(Boolean).join(" • ")}</small></span><em>Kholo →</em>
    </a>
  );
}

export default function LearningSection({ saved, recent, open, results }: Props) {
  return (
    <section id="learning" className="pd-card">
      <h2 className="pd-h">📚 Meri Padhai</h2>

      <h3 className="pd-h3">Saved Books aur Bookmarks</h3>
      {saved.length === 0
        ? <p className="pd-dim">Abhi koi Book save nahi. <Link href="/books">Books page</Link> par ⭐ dabakar save karo.</p>
        : saved.map((b) => <BookRow key={b.id} b={b} />)}

      <h3 className="pd-h3">Haal hi mein kholi gayi</h3>
      {recent.length === 0
        ? <p className="pd-dim">Abhi koi Book nahi kholi gayi.</p>
        : recent.map((b) => <BookRow key={b.id} b={b} note={fmt(b.at)} />)}

      <h3 className="pd-h3">Adhoore Mock Tests</h3>
      {open.length === 0
        ? <p className="pd-dim">Koi adhoora Test nahi.</p>
        : open.map((o) => <Link key={o.id} href={`/mock-tests/${o.testId}`} className="pd-item"><span>{o.title}</span><em>Jaari rakho →</em></Link>)}

      <h3 className="pd-h3">Haal ke Results</h3>
      {results.length === 0
        ? <p className="pd-dim">Abhi koi Result nahi. <Link href="/mock-tests">Test do</Link>.</p>
        : results.slice(0, 3).map((a) => <Link key={a.id} href={`/results/${a.id}`} className="pd-item"><span>{a.title}<small>{fmt(a.at)}</small></span><b>{Math.round(a.pct * 10) / 10}%</b></Link>)}

      <h3 className="pd-h3">Courses</h3>
      <p className="pd-dim">Website mein abhi Courses ka section nahi hai, isliye Enrolled Courses aur unki progress yahan nahi dikhti. Course ka Link Bottom Bar ke Course button se khulta hai.</p>
    </section>
  );
}

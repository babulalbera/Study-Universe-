import { computeBadges, type Attempt } from "@/lib/achievements";

type Props = { hist: Record<string, number>; log: Record<string, { n: number; m: number }>; attempts: Attempt[] };
const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AchievementsSection({ hist, log, attempts }: Props) {
  const { badges, bests } = computeBadges(hist, log, attempts);
  const earned = badges.filter((b) => b.earned);
  return (
    <section id="badges" className="pd-card">
      <h2 className="pd-h">🏅 Achievements <small>({earned.length}/{badges.length})</small></h2>
      <p className="pd-dim">Badge sirf tumhari asli activity (Tasks aur Tests) se milte hain.</p>
      <div className="pd-badges">
        {badges.map((b) => (
          <div key={b.key} className={`pd-badge ${b.earned ? "on" : ""}`}>
            <span className="pd-bi" aria-hidden="true">{b.earned ? b.icon : "🔒"}</span>
            <b>{b.title}</b>
            <small>{b.condition}</small>
            {b.earned
              ? <em>✓ {b.date ? fmt(b.date) : ""}</em>
              : b.progress && <div className="pd-track"><i style={{ width: `${Math.round((b.progress.value / b.progress.target) * 100)}%` }} /></div>}
            {!b.earned && b.progress && <em>{b.progress.value}/{b.progress.target}</em>}
          </div>
        ))}
      </div>
      <h3 className="pd-h3">Personal best</h3>
      <div className="pd-stats">
        <div><b>{bests.longestStreak}</b><span>Sabse lambi streak (din)</span></div>
        <div><b>{bests.mostTasksDay}</b><span>Ek din mein sabse zyada Tasks</span></div>
        <div><b>{bests.bestTestPct === null ? "—" : `${Math.round(bests.bestTestPct * 10) / 10}%`}</b><span>Sabse achha Test score</span></div>
        <div><b>{bests.totalTasks}</b><span>Kul Tasks pure</span></div>
      </div>
    </section>
  );
}

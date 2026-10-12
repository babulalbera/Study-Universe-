"use client";
import { useEffect, useState } from "react";
import { progressFromApi, progressFromLocal, type ApiData, type Progress } from "@/lib/progress";

export default function ProfileProgress({ loggedIn }: { loggedIn: boolean }) {
  const [p, setP] = useState<Progress | null>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!loggedIn) { setP(progressFromLocal()); return; }
    fetch("/api/bar-profile", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiData>)
      .then((d) => { if (alive) setP(progressFromApi(d)); })
      .catch(() => { if (alive) setP(progressFromLocal()); });
    return () => { alive = false; };
  }, [loggedIn]);

  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => setW(p.pct), 80);
    return () => clearTimeout(t);
  }, [p]);

  return (
    <section className="pf-card" aria-label="Daily progress">
      <div className="pf-row"><span>Daily progress</span><b>{p ? `${p.done}/${p.total} tasks` : "—"}</b></div>
      <div className="pf-track"><i style={{ width: `${w}%` }} /></div>
      <div className="pf-stats">
        <div><b>{p ? p.done : "—"}</b><span>Tasks done</span></div>
        <div><b>{p ? p.streak : "—"}</b><span>Streak</span></div>
        <div><b>{p ? `${p.pct}%` : "—"}</b><span>Complete</span></div>
      </div>
    </section>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { streaks, totalDone, type StudyInput } from "@/lib/study-stats";
import type { FullProfile } from "./queries";

type Props = { p: FullProfile; bio: string; input: StudyInput; points: number; level: number; rank: number | null };

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcCheck = () => <svg {...svg}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 9.5" /></svg>;
const IcFlame = () => <svg {...svg}><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.2 1 1.8 1.8 2C10.5 8 10.8 5.5 12 3Z" /></svg>;
const IcBars = () => <svg {...svg}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>;
const IcCap = () => <svg {...svg}><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /></svg>;
const IcPencil = () => <svg {...svg}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /></svg>;
const IcUser = () => <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;

export default function ProfileHeader({ p, bio, input, points, level, rank }: Props) {
  // Streak aur Tasks user ke apne "aaj" ke hisaab se (browser me) nikalte hain
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const s = useMemo(() => (now ? { streak: streaks(input, now).current, done: totalDone(input, now) } : null), [now, input]);

  const initial = (p.fullName || "S").charAt(0).toUpperCase();
  const stats = [
    { key: "tasks", label: "TASKS", value: s ? String(s.done) : "—", icon: <IcCheck /> },
    { key: "streak", label: "STREAK", value: s ? `${s.streak}d` : "—", icon: <IcFlame /> },
    { key: "rank", label: "RANK", value: rank ? `#${rank}` : "—", icon: <IcBars /> },
    { key: "points", label: "POINTS", value: String(points), icon: <IcCap /> },
  ];

  return (
    <section id="profile" className="pr-card">
      <div className="pr-top">
        <div className="pr-avbox">
          {p.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="pr-av" src={p.avatarUrl} alt="Meri profile photo" />
            : <div className="pr-av pr-av-ph" aria-hidden="true">{initial}</div>}
          {p.emailVerified ? <span className="pr-ver" title="Email verified" aria-label="Email verified">✓</span> : null}
        </div>
        <div className="pr-who">
          <h1>{p.fullName || "Student"}</h1>
          <div className="pr-pills">
            <span className="pr-pill"><IcUser /> {p.role === "admin" ? "Admin" : "Student"}</span>
            <span className="pr-streak"><IcFlame /> {s ? s.streak : "—"} day streak</span>
          </div>
          <p className="pr-bio">“{bio || "Big dreams need daily efforts."}”</p>
        </div>
      </div>

      <div className="pr-editrow">
        <Link href="/profile/settings" className="pr-edit"><IcPencil /> Edit Profile</Link>
        <span className="pr-lvl"><i aria-hidden="true" /> LVL {level}</span>
      </div>

      <div className="pr-stats">
        {stats.map((x) => (
          <div key={x.key} className="pr-stat">
            <span className="pr-sic">{x.icon}</span>
            <b>{x.value}</b>
            <small>{x.label}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

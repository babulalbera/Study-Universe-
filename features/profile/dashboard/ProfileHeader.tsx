"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { streaks, type StudyInput } from "@/lib/study-stats";
import { P, type Lang } from "@/lib/i18n";
import type { FullProfile } from "./queries";

type Props = { p: FullProfile; bio: string; input: StudyInput; lang: Lang };

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcFlame = () => <svg {...svg}><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.2 1 1.8 1.8 2C10.5 8 10.8 5.5 12 3Z" /></svg>;
const IcPencil = () => <svg {...svg}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /></svg>;
const IcUser = () => <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;

export default function ProfileHeader({ p, bio, input, lang }: Props) {
  const t = P[lang].hdr;
  // Streak user ke apne "aaj" ke hisaab se (browser me) nikalta hai
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const streak = useMemo(() => (now ? streaks(input, now).current : null), [now, input]);

  const name = p.fullName || t.defaultName;
  const initial = name.charAt(0).toUpperCase();

  return (
    <section id="profile" className="pr-card">
      <div className="pr-top">
        <div className="pr-avbox">
          {p.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="pr-av" src={p.avatarUrl} alt={t.photoAlt} />
            : <div className="pr-av pr-av-ph" aria-hidden="true">{initial}</div>}
          {p.emailVerified ? <span className="pr-ver" title={t.verified} aria-label={t.verified}>✓</span> : null}
        </div>
        <div className="pr-who">
          <h1>{name}</h1>
          <div className="pr-pills">
            <span className="pr-pill"><IcUser /> {p.role === "admin" ? t.admin : t.student}</span>
            <span className="pr-streak"><IcFlame /> {t.streakPill(streak ?? "—")}</span>
          </div>
          <p className="pr-bio">“{bio || t.defaultBio}”</p>
        </div>
      </div>

      <div className="pr-editrow">
        <Link href="/profile/settings" className="pr-edit"><IcPencil /> {t.edit}</Link>
      </div>
    </section>
  );
}

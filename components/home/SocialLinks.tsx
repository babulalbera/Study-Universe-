"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { SocialLinkData } from "@/features/home/data";
import { useToast } from "@/components/ui/Toast";
import "./compact-premium.css";

const PERKS = ["📅 Daily Updates", "❓ Doubts", "📄 PDFs & Notes", "🎥 Free Lectures"];

export default function SocialLinks({ links }: { links: SocialLinkData[] }) {
  const toast = useToast();
  return (
    <section className="cm rv" aria-label="Study Universe Community">
      <div className="cm-top">
        <div className="cm-logo"><Image src="/images/logo.webp" alt="Study Universe logo" width={52} height={52} /></div>
        <div className="cm-ttl">
          <h3>Study Universe Community</h3>
          <p>Daily updates, doubts, PDFs aur free lectures — sab ek jagah jud jao.</p>
        </div>
        <span className="cm-free">FREE</span>
      </div>

      <div className="cm-perks">{PERKS.map((p) => <span key={p}>{p}</span>)}</div>

      <div className="cm-grid">
        {links.map((x) => {
          const style = {
            "--c": x.color, "--g": x.glow, "--gl": `${x.glow}55`,
            "--bd": x.border, "--b1": x.bg1, "--b2": x.bg2,
          } as CSSProperties;
          const body = (
            <>
              <span className="cm-ic"><Image src={x.icon} alt="" width={36} height={36} draggable={false} /></span>
              <span className="cm-tx">
                <span className="cm-nm">{x.name}</span>
                <span className="cm-sub">{x.subtitle}</span>
                <span className="cm-ac">{x.action} →</span>
              </span>
            </>
          );
          return x.href ? (
            <a key={x.key} href={x.href} target="_blank" rel="noopener noreferrer" className="cm-tile" style={style} aria-label={`${x.name} - ${x.action}`}>{body}</a>
          ) : (
            <a key={x.key} href="#" className="cm-tile" style={style} aria-label={`${x.name} - ${x.action}`}
              onClick={(e) => { e.preventDefault(); toast(`${x.name} ka link abhi set nahi hai`); }}>{body}</a>
          );
        })}
      </div>

      <p className="cm-foot">✨ Join karo aur apni preparation ko next level le jao</p>
    </section>
  );
}

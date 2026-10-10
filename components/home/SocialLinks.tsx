"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { SocialLinkData } from "@/features/home/data";
import { useToast } from "@/components/ui/Toast";

const SPARKS = [[8, 14], [22, 80], [38, 30], [55, 12], [68, 70], [80, 25], [91, 62], [47, 90]];

export default function SocialLinks({ links }: { links: SocialLinkData[] }) {
  const toast = useToast();
  return (
    <section className="comm rv">
      <div className="ch">
        <h3>🌟 Study Universe Community</h3>
        <span className="free">FREE</span>
      </div>
      <p>Daily updates, doubts, PDFs aur free lectures — sab ek jagah jud jao.</p>
      <div className="grid social">
        {links.map((x, i) => {
          const style = {
            "--i": i + 8, "--c": x.color, "--g": x.glow, "--gl": `${x.glow}4d`,
            "--bdg": x.border, "--b1": x.bg1, "--b2": x.bg2,
          } as CSSProperties;
          const body = (
            <>
              <span className="face" />
              <span className="ico"><Image src={x.icon} alt="" width={52} height={52} draggable={false} /></span>
              <span className="tx"><span className="nm">{x.name}</span><span className="ds">{x.action}</span></span>
              <span className="dv" />
              <span className="go">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </>
          );
          return x.href ? (
            <a key={x.key} href={x.href} target="_blank" rel="noopener noreferrer" className="s3d" title={x.subtitle} style={style} aria-label={x.name}>{body}</a>
          ) : (
            <a key={x.key} href="#" className="s3d" title={x.subtitle} style={style} aria-label={x.name}
              onClick={(e) => { e.preventDefault(); toast(`${x.name} ka link abhi set nahi hai`); }}>{body}</a>
          );
        })}
      </div>
      {SPARKS.map(([l, t], i) => (
        <i key={i} className="sp" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${(i % 4) * 0.8}s` }} />
      ))}
    </section>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { FeatureCardData } from "@/features/home/data";
import { useToast } from "@/components/ui/Toast";

export default function FeatureCard({ card, index }: { card: FeatureCardData; index: number }) {
  const toast = useToast();
  const style = {
    "--i": index, "--c": card.color, "--b1": `${card.bg1}cc`, "--b2": `${card.bg2}e6`,
    "--bd": `${card.color}38`, "--gl": `${card.color}4d`,
  } as CSSProperties;

  const inner = (
    <>
      <span className="dot" />
      <span className="ico">
        <Image src={card.icon} alt="" width={48} height={48} draggable={false} />
      </span>
      <span className="nm">{card.title}</span>
      <span className="ds">{card.description}</span>
      <span className="btn">Explore →</span>
    </>
  );

  if (!card.href) {
    return (
      <a href="#" className="card" style={style} aria-label={card.title}
        onClick={(e) => { e.preventDefault(); toast(`${card.title} ka link abhi set nahi hai`); }}>
        {inner}
      </a>
    );
  }
  if (/^https?:/.test(card.href)) {
    return <a href={card.href} target="_blank" rel="noopener noreferrer" className="card" style={style} aria-label={card.title}>{inner}</a>;
  }
  return <Link href={card.href} className="card" style={style} aria-label={card.title}>{inner}</Link>;
}

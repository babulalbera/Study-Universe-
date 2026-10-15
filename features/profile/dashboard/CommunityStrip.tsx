"use client";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { IPeople } from "./icons";

type Social = { key: string; name: string; href: string | null; icon: string; color: string };

// Design: "Join Our Community" - gol social icons (link Admin se; na ho to batata hai)
export default function CommunityStrip({ socials }: { socials: Social[] }) {
  const toast = useToast();
  return (
    <section id="community" className="pm-card pm-comm" aria-label="Join Our Community">
      <span className="pm-ic pm-ic-lg"><IPeople size={28} /></span>
      <div className="pm-ct"><h2>Join Our Community</h2><p>Get updates, motivation and study tips</p></div>
      <div className="pm-soc">
        {socials.map((s) => (
          <button key={s.key} type="button" aria-label={s.name} title={s.name} style={{ borderColor: s.color }}
            onClick={() => { if (!s.href) { toast(`${s.name} ka link abhi set nahi hai`); return; } window.open(s.href, "_blank", "noopener,noreferrer"); }}>
            <Image src={s.icon} alt="" width={30} height={30} />
          </button>
        ))}
      </div>
    </section>
  );
}

"use client";
import { useToast } from "@/components/ui/Toast";

type Social = { key: string; name: string; href: string | null };

export default function CommunityButtons({ socials }: { socials: Social[] }) {
  const toast = useToast();
  return (
    <div className="pf-so">
      {socials.map((s) => (
        <button key={s.key} type="button" onClick={() => {
          if (!s.href) { toast(`${s.name} ka link abhi set nahi hai`); return; }
          window.open(s.href, "_blank", "noopener,noreferrer");
        }}>{s.name}</button>
      ))}
    </div>
  );
}

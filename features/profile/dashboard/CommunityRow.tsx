"use client";
import { useToast } from "@/components/ui/Toast";
import { P, type Lang } from "@/lib/i18n";
import { Icon } from "./icons";

type Social = { key: string; name: string; href: string | null; icon: string };

export default function CommunityRow({ socials, lang }: { socials: Social[]; lang: Lang }) {
  const toast = useToast();
  const t = P[lang].cm;
  return (
    <section id="community" className="ov-sec ov-comm">
      <span className="ov-commic"><Icon name="users" size={34} /></span>
      <div className="ov-ctx"><b>{t.title}</b><small>{t.sub}</small></div>
      <div className="ov-soc">
        {socials.map((s) => (
          <button key={s.key} type="button" aria-label={s.name} title={s.name} onClick={() => {
            if (!s.href) { toast(t.notSet(s.name)); return; }
            window.open(s.href, "_blank", "noopener,noreferrer");
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.icon} alt="" width={30} height={30} />
          </button>
        ))}
      </div>
    </section>
  );
}

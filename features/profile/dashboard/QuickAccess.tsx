"use client";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { P, type Lang } from "@/lib/i18n";
import { Icon } from "./icons";

type Tile = { key: string; icon: string; title: string; sub: string; href?: string; plain?: boolean; course?: boolean };

const sv = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcHeart = () => <svg {...sv}><path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" /></svg>;
const IcBook = () => <svg {...sv}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></svg>;
const IcDown = () => <svg {...sv}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>;

export default function QuickAccess({ courseHref, isAdmin, favCount, bookCount, lang }: { courseHref: string | null; isAdmin: boolean; favCount: number; bookCount: number; lang: Lang }) {
  const toast = useToast();
  const t = P[lang].qa;

  // Purane tiles "Aur Sections" ke andar hain, kuch hata nahi hai
  const tiles: Tile[] = [
    { key: "tasks", icon: "check", title: t.tasks[0], sub: t.tasks[1], href: "/tasks", plain: true },
    { key: "books", icon: "book", title: t.booksTile[0], sub: t.booksTile[1], href: "/books" },
    { key: "tests", icon: "doc", title: t.tests[0], sub: t.tests[1], href: "/mock-tests" },
    { key: "res", icon: "chart", title: t.results[0], sub: t.results[1], href: "/results" },
    { key: "course", icon: "grad", title: t.courses[0], sub: t.courses[1], course: true },
    { key: "set", icon: "gear", title: t.settings[0], sub: t.settings[1], href: "/profile/settings" },
    ...(isAdmin ? [{ key: "admin", icon: "shield", title: t.admin[0], sub: t.admin[1], href: "/admin" }] : []),
  ];

  function openCourse() {
    if (!courseHref) { toast(t.courseToast); return; }
    if (/^https?:/.test(courseHref)) window.open(courseHref, "_blank", "noopener,noreferrer");
    else window.location.assign(courseHref);
  }

  const inner = (x: Tile) => (
    <>
      <span className="ov-ic ov-ic-sm"><Icon name={x.icon} /></span>
      <span className="ov-ttx"><b>{x.title}</b><small>{x.sub}</small></span>
      <span className="ov-chev"><Icon name="chevron" size={18} /></span>
    </>
  );

  return (
    <section id="quick" className="pr-qa">
      <div className="pr-sechd"><span>{t.title}</span><i /></div>

      <div className="pr-qa-grid">
        <Link href="/profile/favorites" className="pr-qt fav">
          <span className="pr-qic"><IcHeart /></span>
          <span><b>{t.fav}</b><small>{t.saved(favCount)}</small></span>
        </Link>
        <Link href="/profile/favorites#books" className="pr-qt bk">
          <span className="pr-qic"><IcBook /></span>
          <span><b>{t.books}</b><small>{t.saved(bookCount)}</small></span>
        </Link>
        <button type="button" className="pr-qt off" onClick={() => toast(t.offlineToast)}>
          <span className="pr-qic"><IcDown /></span>
          <span><b>{t.offline}</b><small>{t.soon}</small></span>
        </button>
      </div>

      <details className="pr-more">
        <summary>{t.more}</summary>
        <div className="ov-tiles">
          {tiles.map((x) => x.course
            ? <button key={x.key} type="button" className="ov-tile" onClick={openCourse}>{inner(x)}</button>
            : x.plain
              ? <a key={x.key} className="ov-tile" href={x.href}>{inner(x)}</a>
              : <Link key={x.key} className="ov-tile" href={x.href ?? "/"}>{inner(x)}</Link>)}
        </div>
      </details>
    </section>
  );
}

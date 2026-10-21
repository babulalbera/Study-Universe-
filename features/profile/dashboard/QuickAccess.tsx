"use client";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "./icons";

type Tile = { key: string; icon: string; title: string; sub: string; href?: string; plain?: boolean; course?: boolean };

const sv = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcHeart = () => <svg {...sv}><path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" /></svg>;
const IcBook = () => <svg {...sv}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></svg>;
const IcDown = () => <svg {...sv}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>;

export default function QuickAccess({ courseHref, isAdmin, favCount, bookCount }: { courseHref: string | null; isAdmin: boolean; favCount: number; bookCount: number }) {
  const toast = useToast();

  // Purane tiles ab "Aur Sections" ke andar hain, kuch hata nahi hai
  const tiles: Tile[] = [
    { key: "tasks", icon: "check", title: "Daily Tasks", sub: "Plan & Stay on Track", href: "/tasks", plain: true },
    { key: "books", icon: "book", title: "Books & PDFs", sub: "Read & Download", href: "/books" },
    { key: "tests", icon: "doc", title: "Mock Tests", sub: "Practice & Improve", href: "/mock-tests" },
    { key: "res", icon: "chart", title: "Results", sub: "Test ke Score", href: "/results" },
    { key: "course", icon: "grad", title: "Courses", sub: "Start Learning", course: true },
    { key: "set", icon: "gear", title: "Settings", sub: "Manage Account", href: "/profile/settings" },
    ...(isAdmin ? [{ key: "admin", icon: "shield", title: "Admin Panel", sub: "Content manage", href: "/admin" }] : []),
  ];

  function openCourse() {
    if (!courseHref) { toast("Course ka link abhi set nahi hai"); return; }
    if (/^https?:/.test(courseHref)) window.open(courseHref, "_blank", "noopener,noreferrer");
    else window.location.assign(courseHref);
  }

  const inner = (t: Tile) => (
    <>
      <span className="ov-ic ov-ic-sm"><Icon name={t.icon} /></span>
      <span className="ov-ttx"><b>{t.title}</b><small>{t.sub}</small></span>
      <span className="ov-chev"><Icon name="chevron" size={18} /></span>
    </>
  );

  return (
    <section id="quick" className="pr-qa">
      <div className="pr-sechd"><span>QUICK ACCESS</span><i /></div>

      <div className="pr-qa-grid">
        <Link href="/profile/favorites" className="pr-qt fav">
          <span className="pr-qic"><IcHeart /></span>
          <span><b>Favorites</b><small>{favCount} saved</small></span>
        </Link>
        <Link href="/profile/favorites#books" className="pr-qt bk">
          <span className="pr-qic"><IcBook /></span>
          <span><b>Saved Books</b><small>{bookCount} saved</small></span>
        </Link>
        <button type="button" className="pr-qt off" onClick={() => toast("Offline mode abhi aa raha hai (jald)")}>
          <span className="pr-qic"><IcDown /></span>
          <span><b>Offline</b><small>Coming soon</small></span>
        </button>
      </div>

      <details className="pr-more">
        <summary>Aur Sections: Tasks, Books, Tests, Courses ▾</summary>
        <div className="ov-tiles">
          {tiles.map((t) => t.course
            ? <button key={t.key} type="button" className="ov-tile" onClick={openCourse}>{inner(t)}</button>
            : t.plain
              ? <a key={t.key} className="ov-tile" href={t.href}>{inner(t)}</a>
              : <Link key={t.key} className="ov-tile" href={t.href ?? "/"}>{inner(t)}</Link>)}
        </div>
      </details>
    </section>
  );
}

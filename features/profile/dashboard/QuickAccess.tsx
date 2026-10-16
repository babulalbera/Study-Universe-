"use client";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "./icons";

type Tile = { key: string; icon: string; title: string; sub: string; href?: string; plain?: boolean; course?: boolean };

export default function QuickAccess({ courseHref, isAdmin }: { courseHref: string | null; isAdmin: boolean }) {
  const toast = useToast();

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
    <section id="quick" className="ov-sec">
      <div className="ov-head"><h2><Icon name="bolt" size={24} /> Quick Access</h2></div>
      <div className="ov-tiles">
        {tiles.map((t) => t.course
          ? <button key={t.key} type="button" className="ov-tile" onClick={openCourse}>{inner(t)}</button>
          : t.plain
            ? <a key={t.key} className="ov-tile" href={t.href}>{inner(t)}</a>
            : <Link key={t.key} className="ov-tile" href={t.href ?? "/"}>{inner(t)}</Link>)}
      </div>
    </section>
  );
}

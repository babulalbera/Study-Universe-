"use client";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "./icons";

type Tile = { key: string; icon: string; title: string; sub: string; href?: string; plain?: boolean; course?: boolean };

export default function QuickAccess({ courseHref, isAdmin }: { courseHref: string | null; isAdmin: boolean }) {
  const toast = useToast();
  const [all, setAll] = useState(false);

  const base: Tile[] = [
    { key: "tasks", icon: "check", title: "Daily Tasks", sub: "Plan & Stay on Track", href: "/tasks", plain: true },
    { key: "books", icon: "book", title: "Books & PDFs", sub: "Read & Download", href: "/books" },
    { key: "tests", icon: "doc", title: "Mock Tests", sub: "Practice & Improve", href: "/mock-tests" },
    { key: "course", icon: "grad", title: "Courses", sub: "Start Learning", course: true },
    { key: "me", icon: "user", title: "My Profile", sub: "View Progress", href: "#overview", plain: true },
    { key: "set", icon: "gear", title: "Settings", sub: "Manage Account", href: "#account", plain: true },
  ];
  const more: Tile[] = [
    { key: "res", icon: "chart", title: "Results", sub: "Test ke Score", href: "/results" },
    { key: "badge", icon: "medal", title: "Achievements", sub: "Badges & Bests", href: "#badges", plain: true },
    { key: "alert", icon: "bell", title: "Notifications", sub: "Nayi suchnayein", href: "#alerts", plain: true },
    { key: "help", icon: "help", title: "Help & Support", sub: "FAQ & Report", href: "#help", plain: true },
    ...(isAdmin ? [{ key: "admin", icon: "shield", title: "Admin Panel", sub: "Content manage", href: "/admin" }] : []),
  ];
  const tiles = all ? [...base, ...more] : base;

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
      <div className="ov-head">
        <h2><Icon name="bolt" size={24} /> Quick Access</h2>
        <button type="button" className="ov-more" aria-expanded={all} onClick={() => setAll(!all)}>{all ? "Show Less" : "View All"} <Icon name="chevron" size={15} /></button>
      </div>
      <div className="ov-tiles">
        {tiles.map((t) => t.course
          ? <button key={t.key} type="button" className="ov-tile" onClick={openCourse}>{inner(t)}</button>
          : t.plain || t.href?.startsWith("#")
            ? <a key={t.key} className="ov-tile" href={t.href}>{inner(t)}</a>
            : <Link key={t.key} className="ov-tile" href={t.href ?? "/"}>{inner(t)}</Link>)}
      </div>
    </section>
  );
}

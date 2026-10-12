"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BOTTOM_BAR_CSS, type BarSocial } from "@/lib/bottom-bar";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type ApiData = {
  loggedIn: boolean; name?: string; role?: string; tasks?: number;
  done?: { date: string; count: number } | null; hist?: Record<string, number>;
};
type Me = { loggedIn: boolean; name: string; sub: string; total: number; done: number; streak: number };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Roz kam se kam 1 task complete = 1 din (Task page jaisa hi hisaab)
function derive(d: ApiData): Me {
  if (!d.loggedIn) return { loggedIn: false, name: "Guest", sub: "Guest • Login karo, progress save rahegi", total: 24, done: 0, streak: 0 };
  const today = ymd(new Date());
  const total = d.tasks ?? 24;
  const done = d.done && d.done.date === today ? d.done.count : 0;
  const h: Record<string, number> = { ...(d.hist ?? {}), [today]: done };
  const day = new Date();
  if (!h[ymd(day)]) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (h[ymd(day)] > 0) { streak++; day.setDate(day.getDate() - 1); }
  return { loggedIn: true, name: d.name || "Student", sub: `${d.role === "admin" ? "Admin" : "Member"} • Jai Shri Krishna`, total, done, streak };
}

export default function BottomBar({ courseHref, socials }: { courseHref: string | null; socials: BarSocial[] }) {
  const path = usePathname();
  const toast = useToast();
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [barW, setBarW] = useState(0);

  const route = path === "/" ? "home" : path.startsWith("/tasks") ? "task" : path.startsWith("/books") ? "books" : path.startsWith("/profile") ? "prof" : null;
  const active = open ? "prof" : route;

  const place = useCallback(() => {
    const nav = navRef.current, pill = pillRef.current;
    if (!nav || !pill) return;
    const cur = active ? nav.querySelector<HTMLElement>(`[data-k="${active}"]`) : null;
    if (cur) {
      pill.style.width = `${cur.offsetWidth}px`;
      pill.style.transform = `translateX(${cur.offsetLeft}px)`;
      pill.style.opacity = "1";
    } else pill.style.opacity = "0";
  }, [active]);

  useLayoutEffect(() => { place(); }, [place]);
  useEffect(() => {
    window.addEventListener("resize", place);
    window.addEventListener("load", place);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("load", place); };
  }, [place]);

  const pct = me && me.total ? Math.round((me.done / me.total) * 100) : 0;
  useEffect(() => {
    if (!open || !me) return;
    setBarW(0);
    const t = setTimeout(() => setBarW(pct), 60);
    return () => clearTimeout(t);
  }, [open, me, pct]);

  const vib = () => { try { navigator.vibrate?.(8); } catch { /* koi baat nahi */ } };

  const closeSheet = useCallback(() => {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), 320);
  }, []);

  function openSheet() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    fetch("/api/bar-profile", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiData>)
      .then((d) => setMe(derive(d)))
      .catch(() => setMe(derive({ loggedIn: false })));
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSheet(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeSheet]);

  function go(href: string | null, name: string) {
    if (!href) { toast(`${name} ka link abhi set nahi hai`); return; }
    if (/^https?:/.test(href)) window.open(href, "_blank", "noopener,noreferrer");
    else window.location.assign(href);
  }

  const cls = (k: string) => cn("nbi", active === k && "on");
  const cur = (k: string) => (active === k ? "true" : undefined);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOTTOM_BAR_CSS }} />
      <nav className="nb" ref={navRef} aria-label="Main navigation">
        <span className="nbp" ref={pillRef} aria-hidden="true" />
        <Link href="/" className={cls("home")} data-k="home" aria-current={cur("home")} onClick={vib}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg></span>Home
        </Link>
        <a href="/tasks" className={cls("task")} data-k="task" aria-current={cur("task")} onClick={vib}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></svg></span>Task
        </a>
        <Link href="/books" className={cls("books")} data-k="books" aria-current={cur("books")} onClick={vib}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v13H6.5A1.5 1.5 0 0 0 5 18.5z" /><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3M9 8h6" /></svg></span>Books
        </Link>
        <button type="button" className={cls("course")} data-k="course" aria-current={cur("course")} onClick={() => { vib(); if (open) closeSheet(); go(courseHref, "Course"); }}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m10.5 8.8 4.5 3.2-4.5 3.2z" /></svg></span>Course
        </button>
        <button type="button" className={cls("prof")} data-k="prof" aria-current={cur("prof")} onClick={() => { vib(); if (open) closeSheet(); else openSheet(); }}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.7" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg></span>Profile
        </button>
      </nav>

      {mounted && (
        <div className={cn("nsh", open && "open")}>
          <div className="nsh-bd" onClick={() => { vib(); closeSheet(); }} />
          <section className="nsh-pn" role="dialog" aria-modal="true" aria-labelledby="nshT">
            <button type="button" className="nsh-x" aria-label="Profile band karo" onClick={() => { vib(); closeSheet(); }}>&#10005;</button>
            <div className="nsh-top">
              <div className="nsh-av">{(me?.name ?? "S").charAt(0).toUpperCase()}</div>
              <div>
                <div className="nsh-t" id="nshT">{me ? me.name : "Load ho raha hai…"}</div>
                <div className="nsh-s">{me ? me.sub : ""}</div>
              </div>
            </div>
            <div className="nsh-pl"><span>Daily progress</span><b>{me ? `${me.done}/${me.total} tasks` : "—"}</b></div>
            <div className="nsh-tr"><i style={{ width: `${barW}%` }} /></div>
            <div className="nsh-st">
              <div><b>{me ? me.done : "—"}</b><span>Tasks done</span></div>
              <div><b>{me ? me.streak : "—"}</b><span>Streak</span></div>
              <div><b>{me ? `${pct}%` : "—"}</b><span>Complete</span></div>
            </div>
            <div className="nsh-ac">
              {me?.loggedIn ? (
                <>
                  <Link href="/profile" onClick={closeSheet}>Poori Profile</Link>
                  <Link href="/results" onClick={closeSheet}>Results</Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeSheet}>Login</Link>
                  <Link href="/signup" onClick={closeSheet}>Signup</Link>
                </>
              )}
            </div>
            <div className="nsh-h">Join community</div>
            <div className="nsh-so">
              {socials.map((s) => (
                <button key={s.key} type="button" onClick={() => { vib(); go(s.href, s.name); }}>{s.name}</button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

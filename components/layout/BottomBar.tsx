"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { BOTTOM_BAR_CSS } from "@/lib/bottom-bar";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

// courseHref: Admin > Settings mein "Course ka Link" se aata hai (Home ke Free Course Card se bilkul alag).
export default function BottomBar({ courseHref }: { courseHref: string | null }) {
  const path = usePathname();
  const toast = useToast();
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  const active = path === "/" ? "home" : path.startsWith("/tasks") ? "task" : path.startsWith("/books") ? "books" : path.startsWith("/profile") ? "prof" : null;

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

  const vib = () => { try { navigator.vibrate?.(8); } catch { /* koi baat nahi */ } };
  const cls = (k: string) => cn("nbi", active === k && "on");
  const cur = (k: string) => (active === k ? "page" : undefined);

  function openCourse() {
    vib();
    if (!courseHref) { toast("Course ka link abhi set nahi hai"); return; }
    if (/^https?:/.test(courseHref)) window.open(courseHref, "_blank", "noopener,noreferrer");
    else window.location.assign(courseHref);
  }

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
        <button type="button" className={cls("course")} data-k="course" onClick={openCourse}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m10.5 8.8 4.5 3.2-4.5 3.2z" /></svg></span>Course
        </button>
        <Link href="/profile" className={cls("prof")} data-k="prof" aria-current={cur("prof")} onClick={vib}>
          <span className="pl"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.7" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg></span>Profile
        </Link>
      </nav>
    </>
  );
}

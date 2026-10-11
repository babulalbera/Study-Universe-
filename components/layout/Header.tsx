"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav";

export default function Header() {
  const path = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tick = false;
    const onScroll = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        headerRef.current?.classList.toggle("sc", scrollY > 8);
        if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
        tick = false;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef}>
      <div className="hin">
        <Link href="/" className="brand" aria-label="Study Universe Home">
          <div className="logo" style={{ padding: 0, overflow: "hidden", background: "transparent", border: "2px solid #D4AF37", boxShadow: "0 0 18px rgba(212,175,55,.5)" }}>
            <Image src="/images/logo.webp" alt="Study Universe Logo" width={42} height={42} priority style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          </div>
          <div><div className="title">Study Universe</div></div>
        </Link>
        <nav className="su-nav" aria-label="Main">
          {NAV_ITEMS.map((n) => (
            <Link key={n.href} href={n.href} prefetch={false} className={cn(isActive(path, n.href) && "on")}>{n.label}</Link>
          ))}
        </nav>
        <Link href="/profile" className="me" aria-label="Profile">👤</Link>
      </div>
      <div id="pg" ref={barRef} aria-hidden="true" />
    </header>
  );
}

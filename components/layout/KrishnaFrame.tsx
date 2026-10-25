"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import HeroSection from "@/components/home/HeroSection";
import KrishnaStrip from "@/components/home/KrishnaStrip";

// Upar wala aur neeche wala Krishna box: Home, Books, Profile, Results... sab pages par.
// Ye pages isse bahar hain: Admin aur Test dene ka page (dhyan na bante).
const HIDE = ["/admin", "/auth", "/mock-tests/"];
// Login/Signup par upar ka bada box nahi (premium form ko jagah chahiye). Wapas dikhana ho to is list se hata do.
const HIDE_HERO = ["/login", "/signup"];

export default function KrishnaFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const show = !HIDE.some((h) => (h.endsWith("/") ? path.startsWith(h) : path === h || path.startsWith(`${h}/`)));
  const showHero = show && path !== "/" && !HIDE_HERO.includes(path);
  return (
    <>
      {showHero && <HeroSection />}  {/* Home par apna bada hero hai */}
      {children}
      {show && <KrishnaStrip />}
    </>
  );
}

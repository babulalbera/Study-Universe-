"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import HeroSection from "@/components/home/HeroSection";
import KrishnaStrip from "@/components/home/KrishnaStrip";

// Upar wala aur neeche wala Krishna box: Home, Books, Profile, Results... sab pages par.
// Ye pages isse bahar hain: Admin aur Test dene ka page (dhyan na bante).
const HIDE = ["/admin", "/auth", "/mock-tests/"];
// Login/Signup card ke andar apna Krishna box hai, isliye yahan dono box nahi. Wapas dikhana ho to list se hata do.
const HIDE_ALL = ["/login", "/signup"];

export default function KrishnaFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const hide = HIDE.some((h) => (h.endsWith("/") ? path.startsWith(h) : path === h || path.startsWith(`${h}/`))) || HIDE_ALL.includes(path);
  return (
    <>
      {!hide && path !== "/" && <HeroSection />}  {/* Home par apna bada hero hai */}
      {children}
      {!hide && <KrishnaStrip />}
    </>
  );
}

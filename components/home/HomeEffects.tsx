"use client";
import { useEffect } from "react";

// Original HTML ke effects: card tilt/glow, reveal-on-scroll.
export default function HomeEffects() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cleanups: Array<() => void> = [];
    document.querySelectorAll<HTMLElement>(".card,.s3d,.cm-tile,.lp-track").forEach((c) => {
      const move = (e: PointerEvent) => {
        const r = c.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty("--mx", `${x}px`);
        c.style.setProperty("--my", `${y}px`);
        if (fine && !reduce) {
          c.style.setProperty("--ry", `${((x / r.width - 0.5) * 10).toFixed(1)}deg`);
          c.style.setProperty("--rx", `${((0.5 - y / r.height) * 10).toFixed(1)}deg`);
        }
      };
      const leave = () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); };
      c.addEventListener("pointermove", move);
      c.addEventListener("pointerleave", leave);
      cleanups.push(() => { c.removeEventListener("pointermove", move); c.removeEventListener("pointerleave", leave); });
    });

    const io = new IntersectionObserver((list) => {
      list.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".rv").forEach((e) => io.observe(e));

    return () => { cleanups.forEach((f) => f()); io.disconnect(); root.classList.remove("js"); };
  }, []);
  return null;
}

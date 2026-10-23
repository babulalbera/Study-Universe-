"use client";
import { useEffect, useRef } from "react";

// Piche ka premium mahaul: aurora, chamakte kan, mouse spotlight, hero parallax, magnetic buttons.
// Reduced-motion walon ke liye kuch bhi nahi chalta.
export default function BackgroundFX() {
  const cv = useRef<HTMLCanvasElement>(null);
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
    const cleanups: Array<() => void> = [];

    // ---- chamakte kan (canvas) ----
    const c = cv.current;
    const cx = c?.getContext("2d");
    if (c && cx) {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      let W = 0, H = 0, raf = 0, frame = 0, col = "255,215,0";
      const size = () => { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      size();
      const N = W < 600 ? 26 : 48;
      const ps = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + 0.5, v: Math.random() * 0.28 + 0.08, p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.006 }));
      const tick = () => {
        if (!document.hidden) {
          if (frame++ % 20 === 0) {
            const v = getComputedStyle(document.documentElement).getPropertyValue("--gold2").trim();
            const m = v.match(/[\d.]+/g);
            if (m && m.length >= 3 && /rgb/.test(v)) col = `${Math.round(+m[0])},${Math.round(+m[1])},${Math.round(+m[2])}`;
          }
          cx.clearRect(0, 0, W, H);
          for (const q of ps) {
            q.y -= q.v; q.p += q.s; q.x += Math.sin(q.p) * 0.25;
            if (q.y < -8) { q.y = H + 8; q.x = Math.random() * W; }
            cx.beginPath();
            cx.fillStyle = `rgba(${col},${(0.25 + 0.55 * Math.abs(Math.sin(q.p * 1.6))).toFixed(2)})`;
            cx.shadowColor = `rgba(${col},.9)`; cx.shadowBlur = 10;
            cx.arc(q.x, q.y, q.r, 0, 6.283); cx.fill();
          }
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
      addEventListener("resize", size);
      cleanups.push(() => { cancelAnimationFrame(raf); removeEventListener("resize", size); });
    }

    // ---- mouse: spotlight + hero parallax + magnetic buttons ----
    if (fine) {
      let raf = 0, mx = 0, my = 0;
      const move = (e: PointerEvent) => {
        mx = e.clientX; my = e.clientY;
        if (!raf) raf = requestAnimationFrame(() => {
          raf = 0;
          const s = spot.current;
          if (s) { s.style.setProperty("--sx", `${mx}px`); s.style.setProperty("--sy", `${my}px`); s.classList.add("on"); }
          const orb = document.querySelector<HTMLElement>(".lp-orb");
          if (orb) { orb.style.setProperty("--px", (mx / innerWidth - 0.5).toFixed(3)); orb.style.setProperty("--py", (my / innerHeight - 0.5).toFixed(3)); }
        });
        const b = (e.target as HTMLElement | null)?.closest<HTMLElement>(".lp-btn");
        if (b) {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1)}px)`;
        }
      };
      const out = (e: PointerEvent) => { (e.target as HTMLElement | null)?.closest<HTMLElement>(".lp-btn")?.style.removeProperty("transform"); };
      const leave = () => spot.current?.classList.remove("on");
      addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerout", out);
      document.addEventListener("pointerleave", leave);
      cleanups.push(() => { cancelAnimationFrame(raf); removeEventListener("pointermove", move); document.removeEventListener("pointerout", out); document.removeEventListener("pointerleave", leave); });
    }
    return () => cleanups.forEach((f) => f());
  }, []);

  return (
    <>
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <canvas id="fx" ref={cv} aria-hidden="true" />
      <div className="spot" ref={spot} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

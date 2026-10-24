"use client";
import { useEffect, useRef, useState } from "react";

// Task app ko page ke andar bina alag scroll ke dikhata hai: frame ki unchai app ke hisaab se badhti hai,
// aur popup (modal) wahi dikhte hain jahan user abhi scroll karke dekh raha hai.
const TOP_GAP = 70;    // upar sticky header
const BOTTOM_GAP = 96; // neeche floating bottom bar

export default function TaskFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    let ro: ResizeObserver | null = null;
    let raf = 0;
    let last = 0;

    const view = () => {
      const d = f.contentDocument;
      if (!d) return;
      const r = f.getBoundingClientRect();
      const top = Math.max(0, -r.top + TOP_GAP);
      const bottom = Math.min(r.height, window.innerHeight - r.top - BOTTOM_GAP);
      const root = d.documentElement.style;
      root.setProperty("--vt", `${Math.round(top)}px`);
      root.setProperty("--vh", `${Math.max(320, Math.round(bottom - top))}px`);
    };
    const fit = () => {
      const d = f.contentDocument;
      const el = d?.getElementById("root");
      if (!d || !el) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 50 && Math.abs(h - last) > 1) {
        last = h;
        f.style.height = `${h}px`;
      }
      view();
    };
    const tick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(view); };

    const attach = () => {
      const d = f.contentDocument;
      if (!d || !d.getElementById("root")) return;
      ro?.disconnect();
      ro = new ResizeObserver(fit);
      ro.observe(d.getElementById("root")!);
      fit();
      setReady(true);
    };

    f.addEventListener("load", attach);
    if (f.contentDocument?.readyState === "complete") attach();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      f.removeEventListener("load", attach);
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  return (
    <div style={{ minHeight: ready ? undefined : 480 }}>
      <iframe
        ref={ref}
        src="/tasks/app"
        title="Daily Tasks"
        scrolling="no"
        style={{ display: "block", width: "100%", height: 480, border: 0, background: "transparent", colorScheme: "dark" }}
      />
    </div>
  );
}

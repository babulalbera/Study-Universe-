"use client";
import { useLayoutEffect, useRef, useState } from "react";

// Original Task page (Design, Animation, Buttons sab wahi) ek frame mein. Height screen ke hisab se.
export default function TaskFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(560);

  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      const nav = document.querySelector<HTMLElement>(".su-bottom");
      const navH = nav && getComputedStyle(nav).display !== "none" ? nav.getBoundingClientRect().height : 0;
      setH(Math.max(420, Math.floor(window.innerHeight - el.getBoundingClientRect().top - navH - 8)));
    };
    window.scrollTo(0, 0);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <iframe ref={ref} src="/task-app" title="Daily Tasks" allow="notifications"
      style={{ width: "100%", height: h, border: 0, borderRadius: 18, background: "#020603", display: "block" }} />
  );
}

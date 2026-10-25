"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";

const KQ = "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन";
const COLS = ["var(--gold2)", "var(--gold3)", "var(--em)", "var(--mint)", "#fff"];
const PET = [["#34d399", "#0ea5a4"], ["#FFD700", "#E8B84A"], ["#38bdf8", "#6366f1"], ["#a7f3d0", "#10B981"]];

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function restart(el: HTMLElement | null, cls: string) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Krishna box: gireti pankhudiyan, shloka type hota hai, "Ashirwad lo" counter (sirf is device me save).
export default function KrishnaBox() {
  const [petals, setPetals] = useState<CSSProperties[]>([]);
  const [typed, setTyped] = useState("");
  const [count, setCount] = useState(0);
  const [sparks, setSparks] = useState<CSSProperties[]>([]);
  const petalsRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLElement>(null);

  // pankhudiyan
  useEffect(() => {
    if (reduced()) return;
    const list: CSSProperties[] = Array.from({ length: 14 }, (_, i) => {
      const c = PET[i % PET.length];
      return {
        "--x": `${(Math.random() * 100).toFixed(1)}%`,
        "--dx": `${(Math.random() * 80 - 40).toFixed(0)}px`,
        "--t": `${(7 + Math.random() * 6).toFixed(1)}s`,
        "--dl": `${(-Math.random() * 10).toFixed(1)}s`,
        "--c1": c[0],
        "--c2": c[1],
      } as CSSProperties;
    });
    setPetals(list);
    const el = petalsRef.current;
    const fall = () => el?.style.setProperty("--fall", `${(el.offsetHeight || 200) + 30}px`);
    fall();
    window.addEventListener("resize", fall);
    return () => window.removeEventListener("resize", fall);
  }, []);

  // shloka type hota hai
  useEffect(() => {
    if (reduced()) { setTyped(KQ); return; }
    const segs = typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter("hi", { granularity: "grapheme" }).segment(KQ), (s) => s.segment)
      : Array.from(KQ);
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setTyped(segs.slice(0, i).join(""));
      if (i < segs.length) t = setTimeout(step, 75);
    };
    t = setTimeout(step, 900);
    return () => clearTimeout(t);
  }, []);

  // ashirwad counter
  useEffect(() => {
    try { setCount(parseInt(localStorage.getItem("su-ashirwad") || "0", 10) || 0); } catch { /* ignore */ }
  }, []);

  const bless = () => {
    const n = count + 1;
    setCount(n);
    try { localStorage.setItem("su-ashirwad", String(n)); } catch { /* ignore */ }
    if (reduced()) return;
    restart(countRef.current, "tick");
    restart(orbRef.current, "bless");
    setSparks(Array.from({ length: 12 }, (_, k) => {
      const a = Math.random() * Math.PI * 2;
      const d = 26 + Math.random() * 44;
      return { "--c": COLS[k % COLS.length], "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, "--rot": "0deg" } as CSSProperties;
    }));
    setTimeout(() => setSparks([]), 1100);
  };

  return (
    <>
      <div className="ac-petals" ref={petalsRef} aria-hidden="true">
        {petals.map((s, i) => <i key={i} style={s} />)}
      </div>
      <div className="ac-kbox">
        <span className="ac-orb ac-korb" ref={orbRef} aria-hidden="true">
          <span className="ac-r2" /><span className="ac-r1" />
          <span className="ac-orbit"><i /><i /><i /></span>
          <span className="ac-av"><Image src="/images/hero-krishna.webp" alt="" width={120} height={120} /></span>
        </span>
        <div className="ac-ktx">
          <span className="ac-kbadge"><i />KRISHNA BLESSINGS</span>
          <p className="ac-kq" lang="sa" aria-label={KQ}>“<span>{typed}</span><b className="ac-caret" aria-hidden="true" />”</p>
          <p className="ac-kmean">मेहनत तुम्हारी, सफलता निश्चित है — कान्हा तुम्हारे साथ है</p>
          <div className="ac-kact">
            <button type="button" className="ac-kbless" onClick={bless}><span aria-hidden="true">🙏</span>Ashirwad lo</button>
            <span className="ac-kcount"><b ref={countRef}>{count}</b> ashirwad mile</span>
            <span className="ac-ksp" aria-hidden="true">
              {sparks.length > 0 && <b>+1</b>}
              {sparks.map((s, i) => <i key={i} style={s} />)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BLESSINGS, GOLD_WORDS, SLOKAS, SUB_LINES, type Blessing } from "@/features/tasks/blessings";
import Portal from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import "./blessing.css";

export type BlessingData = { taskName: string; taskHi: string; quoteIdx: number; key: number };

const SHOW_MS = 5000;

// Quote ke khaas shabd theme ke golden rang me
function Quote({ q }: { q: Blessing }) {
  return (
    <>
      {q.text.split(/(\s+)/).map((w, i) => {
        const clean = w.replace(/[.,!?:;।]/g, "").toLowerCase();
        const exact = (h: string) => clean === h.toLowerCase() || (clean.length >= 4 && (clean.includes(h.toLowerCase()) || h.toLowerCase().includes(clean)));
        const hit = clean.length > 0 && (q.highlights.some(exact) || GOLD_WORDS.some((g) => clean === g || (clean.length >= 4 && w.toLowerCase().includes(g))));
        return hit ? <span key={i} className="bp-gold">{w}</span> : <span key={i}>{w}</span>;
      })}
    </>
  );
}

// Task complete hone par "Jai Shree Krishna" popup. 5 second me band hota hai; dabaye rakho to ruk jata hai.
// Rang site ki theme se aate hain (--gold, --em ...), isliye theme badalte hi popup ka rang bhi badal jata hai.
export default function BlessingPopup({ data, onClose }: { data: BlessingData; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const [held, setHeld] = useState(false);
  const left = useRef(SHOW_MS);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Har popup par alag quote + alag support line + alag shloka (data.key har baar naya hota hai)
  const q = BLESSINGS[data.quoteIdx % BLESSINGS.length];
  const mix = (data.key + data.quoteIdx * 7919) % 100003;
  const sub = SUB_LINES[mix % SUB_LINES.length];
  const sloka = SLOKAS[Math.floor(mix / 7) % SLOKAS.length];

  // onClose har draw par naya banta hai; use ref me rakhte hain, warna 5 second ka timer baar-baar shuru ho jata
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setClosing(true);
    setTimeout(() => onCloseRef.current(), 320);
  }, []);

  // Timer: shuru, dabane par pause (bacha hua time yaad), chhodne par wahin se aage
  useEffect(() => {
    if (closing) return;
    if (held) {
      if (timer.current) clearTimeout(timer.current);
      left.current = Math.max(0, left.current - (Date.now() - startedAt.current));
      return;
    }
    startedAt.current = Date.now();
    timer.current = setTimeout(close, left.current);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [held, closing, close]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close]);

  return (
    <Portal>
      <div className="bp-root" role="dialog" aria-modal="true" aria-label="Task complete — Jai Shree Krishna">
        <div className={cn("bp-bg", closing ? "bp-bg-out" : "bp-bg-in")} onClick={close} />

        <div
          className={cn("bp-card", held && "is-held", closing ? "is-closing" : "is-open")}
          onMouseDown={() => setHeld(true)} onMouseUp={() => setHeld(false)} onMouseLeave={() => setHeld(false)}
          onTouchStart={() => setHeld(true)} onTouchEnd={() => setHeld(false)} onTouchCancel={() => setHeld(false)}
        >
          <div className="bp-glow" aria-hidden="true"><i /><i /><b /></div>

          <button type="button" onClick={close} aria-label="Band karo" className="bp-x">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>

          {/* Krishna ki gol photo (upar beech me) */}
          <div className="bp-av">
            <span className="bp-halo" aria-hidden="true" />
            <span className="bp-ring" aria-hidden="true"><i /></span>
            <span className="bp-ringbg" aria-hidden="true" />
            <div className="bp-photo">
              <Image src="/images/hero-krishna.webp" alt="Bal Krishna" width={140} height={140} />
              <span className="bp-twinkle" aria-hidden="true" />
            </div>
          </div>

          <h2 className="bp-title">Jai Shree Krishna</h2>

          <div className="bp-head">
            <p className="bp-status">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              TASK COMPLETED • JAI HIND 🇮🇳
            </p>
            <p className="bp-task">
              <b>{data.taskName}</b>
              {data.taskHi && <><i>•</i><span>{data.taskHi}</span></>}
            </p>
          </div>

          <div className="bp-quote">
            <p className="bp-qt"><Quote q={q} /></p>
            <p className="bp-sub">{sub}</p>
          </div>

          <div className="bp-sloka">
            <p className="bp-sl"><i aria-hidden="true" /><span lang="sa">{sloka.sa}</span><i aria-hidden="true" /></p>
            <p className="bp-mean" lang="hi">{sloka.hi}</p>
          </div>

          <div className="bp-foot">
            <div className="bp-track"><div className="bp-bar" style={{ animationPlayState: held ? "paused" : "running" }} /></div>
            <div className="bp-hint">
              <span>{held ? "Paused (holding)" : ""}</span>
              <span>Tap outside to close</span>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

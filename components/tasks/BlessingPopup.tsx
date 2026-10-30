"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BLESSINGS, GOLD_WORDS, type Blessing } from "@/features/tasks/blessings";
import { cn } from "@/lib/utils";

export type BlessingData = { taskName: string; taskHi: string; quoteIdx: number; key: number };

const SHOW_MS = 5000;

// Quote ke khaas shabd golden rang me
function Quote({ q }: { q: Blessing }) {
  return (
    <>
      {q.text.split(/(\s+)/).map((w, i) => {
        const clean = w.replace(/[.,!?:;।]/g, "").toLowerCase();
        const hit = q.highlights.some((h) => clean.includes(h.toLowerCase()) || h.toLowerCase().includes(clean)) || GOLD_WORDS.some((g) => w.toLowerCase().includes(g));
        return hit && w.trim().length > 0
          ? <span key={i} className="font-bold text-[#FACC15] drop-shadow-[0_0_8px_rgba(250,204,21,0.35)]">{w}</span>
          : <span key={i}>{w}</span>;
      })}
    </>
  );
}

// Task complete hone par "Jai Shree Krishna" popup. 5 second me band hota hai; dabaye rakho to ruk jata hai.
export default function BlessingPopup({ data, onClose }: { data: BlessingData; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const [held, setHeld] = useState(false);
  const left = useRef(SHOW_MS);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = BLESSINGS[data.quoteIdx % BLESSINGS.length];

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Task complete — Jai Shree Krishna">
      <div
        className={cn("absolute inset-0 backdrop-blur-[14px]", closing ? "tk-bg-out" : "tk-bg-in")}
        style={{ background: "radial-gradient(120% 120% at 50% 10%, rgba(16,185,129,0.20) 0%, rgba(0,0,0,0.82) 42%, rgba(0,0,0,0.92) 100%)" }}
        onClick={close}
      />
      <div
        className={cn(
          "relative flex max-h-[90vh] w-[88%] max-w-[300px] flex-col rounded-[22px] border-[1.5px] border-[#D4AF37]/55 bg-gradient-to-br from-[#0a1710] via-[#0f2418] to-[#0a120a] pt-[72px] shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.07)] transition-transform duration-200 md:max-w-[340px] md:pt-[80px]",
          held && "scale-[0.985]", closing ? "tk-card-out" : "tk-card-in",
        )}
        onMouseDown={() => setHeld(true)} onMouseUp={() => setHeld(false)} onMouseLeave={() => setHeld(false)}
        onTouchStart={() => setHeld(true)} onTouchEnd={() => setHeld(false)} onTouchCancel={() => setHeld(false)}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px rounded-t-[20px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[0.06] via-white/[0.015] to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/[0.10] blur-[24px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#D4AF37]/[0.08] blur-[20px]" />

        <button type="button" onClick={close} aria-label="Band karo" className="absolute right-3 top-3 z-[60] grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/65 text-[13px] text-white/70 transition hover:border-[#D4AF37]/40 hover:text-white active:scale-90">✕</button>

        {/* Krishna ki gol photo (upar beech me) */}
        <div className="tk-profile absolute left-1/2 top-0 z-50">
          <div className="tk-halo pointer-events-none absolute left-1/2 top-1/2 h-[155%] w-[155%] rounded-full bg-gradient-to-br from-[#D4AF37]/35 via-amber-300/20 to-emerald-500/25 blur-[18px]" />
          <div className="pointer-events-none absolute -inset-[6px] overflow-hidden rounded-full opacity-90">
            <div className="tk-ring absolute inset-[-65%] rounded-full" style={{ background: "conic-gradient(from 0deg,#D4AF37,#FFD700,#10b981,#D4AF37,#FF8A00,#D4AF37)" }} />
          </div>
          <div className="pointer-events-none absolute -inset-[2px] rounded-full bg-[#0a1710]" />
          <div className="relative h-[124px] w-[124px] overflow-hidden rounded-full border-[3.5px] border-[#D4AF37] bg-black shadow-[0_0_0_2.5px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.55),0_0_52px_rgba(16,185,129,0.28)] md:h-[140px] md:w-[140px]">
            <Image src="/images/hero-krishna.webp" alt="Bal Krishna" width={140} height={140} className="h-full w-full scale-[1.1] object-cover object-[center_22%]" />
            <span className="tk-twinkle pointer-events-none absolute left-[56.5%] top-[38.5%] h-[3px] w-[3px] rounded-full bg-white shadow-[0_0_6px_white]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/[0.14]" />
          </div>
        </div>

        <div className="mt-1 flex w-full flex-col items-center px-3">
          <h2 className="text-center text-[18px] font-bold leading-none tracking-wide text-[#FACC15] drop-shadow-[0_0_14px_rgba(250,204,21,0.55)] md:text-[20px]">Jai Shree Krishna</h2>
        </div>

        <div className="mt-3 flex flex-col items-center px-3 text-center">
          <p className="text-[10px] font-black tracking-[0.14em] text-emerald-300">TASK COMPLETED • JAI HIND 🇮🇳</p>
          <p className="mt-1.5 text-[13px] leading-tight">
            <span className="font-bold tracking-tight text-white">{data.taskName}</span>
            <span className="mx-1 text-zinc-600">•</span>
            <span className="font-medium text-emerald-200/80">{data.taskHi}</span>
          </p>
        </div>

        <div className="relative mx-3 mt-3 rounded-[12px] border border-white/[0.06] border-l-[3px] border-l-[#D4AF37]/80 bg-black/35 p-3 shadow-[0_0_18px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
          <span className="pointer-events-none absolute -right-2 -top-1 select-none font-serif text-[24px] leading-none text-[#D4AF37]/[0.12]">“</span>
          <p className="text-[13px] font-semibold leading-[1.4] tracking-tight text-[#FEF3C7] md:text-[14px]"><Quote q={q} /></p>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-snug text-emerald-200/85">
            <span className="mt-0.5 shrink-0 text-[10px]">✨</span>
            <span>Kanha ka ashirwad tumhare saath hai • Vardi ke 1 kadam aur kareeb</span>
          </p>
        </div>

        <div className="mx-3 mt-3 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
          <i className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
          <span lang="sa" className="text-center text-[10px] font-semibold leading-tight tracking-wide text-[#FFEAA7]/85 md:text-[11px]">कर्मण्येवाधिकारस्ते मा फलेषु कदाचन</span>
          <i className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
        </div>

        <div className="mt-3 px-3 pb-3">
          <div className="relative h-[4px] w-full overflow-hidden rounded-full border border-white/5 bg-black/60">
            <div className="tk-bar absolute inset-y-0 left-0 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-emerald-400" style={{ width: "100%", animationPlayState: held ? "paused" : "running" }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-white/45">
            <span className="min-h-[14px] text-amber-200/80">{held ? "⏸️ Paused (holding)" : ""}</span>
            <span>Tap outside to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

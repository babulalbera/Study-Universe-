#!/bin/sh
# Premium PDF Reader: Book ab page-by-page khulti hai (pdf.js), zoom, Light/Sepia/Night, swipe,
# slider, fullscreen, aur last page se resume + progress save. Link wali Books pehle jaise iframe me.
# Chalane ka tareeka:  sh apply-pdf-reader.sh
set -e
cd ~/Study-Universe-

git checkout -b feat/premium-pdf-reader 2>/dev/null || git checkout feat/premium-pdf-reader

echo "== pdfjs-dist install =="
npm install pdfjs-dist@^4.10.38

mkdir -p components/books types

# ---------------------------------------------------------------- types/pdfjs.d.ts
cat > types/pdfjs.d.ts <<'EOF_PDFJS_D_TS'
// pdf.js ka legacy build (purane Android phones par bhi chalta hai). Types hum PdfReader.tsx me khud likhte hain.
declare module "pdfjs-dist/legacy/build/pdf.mjs";
EOF_PDFJS_D_TS

# ---------------------------------------------------------------- next.config.ts
cat > next.config.ts <<'EOF_NEXT_CONFIG'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  // pdf.js browser build "canvas" package dhundhta hai jo hame chahiye nahi; usse band karo.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = { ...(config.resolve.alias ?? {}), canvas: false };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
EOF_NEXT_CONFIG

# ---------------------------------------------------------------- components/books/PdfReader.tsx
cat > components/books/PdfReader.tsx <<'EOF_PDF_READER'
"use client";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { saveBookProgress } from "@/features/profile/dashboard/progress-actions";
import "./pdf-reader.css";

// pdf.js ke sirf wahi hisse jo hum use karte hain
type RenderTask = { promise: Promise<unknown>; cancel: () => void };
type PdfPage = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; transform?: number[] }) => RenderTask;
};
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage>; destroy: () => Promise<void> };
type LoadingTask = { promise: Promise<PdfDoc>; destroy: () => Promise<void>; onProgress?: (p: { loaded: number; total?: number }) => void };
type PdfJs = { GlobalWorkerOptions: { workerSrc: string }; getDocument: (o: { url: string }) => LoadingTask };

type Theme = "light" | "sepia" | "night";
const THEMES: Theme[] = ["light", "sepia", "night"];
const THEME_LABEL: Record<Theme, string> = { light: "Light", sepia: "Sepia", night: "Night" };
const PREFS_KEY = "su-reader-prefs";
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3;

const sv = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcPrev = () => <svg {...sv}><path d="m15 5-7 7 7 7" /></svg>;
const IcNext = () => <svg {...sv}><path d="m9 5 7 7-7 7" /></svg>;
const IcMinus = () => <svg {...sv}><path d="M5 12h14" /></svg>;
const IcPlus = () => <svg {...sv}><path d="M12 5v14M5 12h14" /></svg>;
const IcTheme = () => <svg {...sv}><circle cx="12" cy="12" r="8" /><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16" fill="currentColor" stroke="none" /></svg>;
const IcFull = () => <svg {...sv}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
const IcExit = () => <svg {...sv}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;

type Props = { bookId: string; src: string; title: string; initialPage: number };

export default function PdfReader({ bookId, src, title, initialPage }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const pageRef = useRef(1);
  const savedRef = useRef(initialPage > 0 ? initialPage : 0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const start = Math.max(1, Math.floor(initialPage) || 1);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(start);
  const [pageInput, setPageInput] = useState(String(start));
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("light");
  const [prefsReady, setPrefsReady] = useState(false);
  const [width, setWidth] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [canFs, setCanFs] = useState(false);
  const [isFs, setIsFs] = useState(false);

  // ---- PDF kholo (sirf browser me; server par kabhi nahi chalta)
  useEffect(() => {
    let dead = false;
    let task: LoadingTask | null = null;
    setDoc(null);
    setError(false);
    setLoadPct(0);
    (async () => {
      try {
        const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJs;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
        task = pdfjs.getDocument({ url: src });
        task.onProgress = (p) => {
          if (!dead && p.total) setLoadPct(Math.min(100, Math.round((p.loaded / p.total) * 100)));
        };
        const d = await task.promise;
        if (dead) {
          void d.destroy();
          return;
        }
        setNumPages(d.numPages);
        setPage((p) => Math.min(Math.max(1, p), d.numPages));
        setDoc(d);
      } catch {
        if (!dead) setError(true);
      }
    })();
    return () => {
      dead = true;
      taskRef.current?.cancel();
      void task?.destroy();
    };
  }, [src]);

  // ---- Stage ki chaudai (phone rotate / window resize par page dobara fit hota hai)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // ---- Page ko canvas par banao (pehle alag canvas me, phir copy: flicker nahi hota)
  useEffect(() => {
    if (!doc || !width) return;
    let dead = false;
    taskRef.current?.cancel();
    setRendering(true);
    (async () => {
      try {
        const pg = await doc.getPage(page);
        if (dead) return;
        const base = pg.getViewport({ scale: 1 });
        const scale = (Math.max(160, width - 24) / base.width) * zoom;
        const vp = pg.getViewport({ scale });
        const maxDpr = Math.sqrt(12_000_000 / (vp.width * vp.height));
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, maxDpr));

        const off = document.createElement("canvas");
        off.width = Math.floor(vp.width * dpr);
        off.height = Math.floor(vp.height * dpr);
        const octx = off.getContext("2d");
        if (!octx) return;
        const t = pg.render({ canvasContext: octx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
        taskRef.current = t;
        await t.promise;
        if (dead) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        canvas.width = off.width;
        canvas.height = off.height;
        canvas.style.width = `${Math.floor(vp.width)}px`;
        canvas.style.height = `${Math.floor(vp.height)}px`;
        ctx.drawImage(off, 0, 0);
        off.width = 0;
        off.height = 0;
        setRendering(false);
      } catch {
        /* cancel hua ya render fail: agla render sambhal lega */
      }
    })();
    return () => {
      dead = true;
    };
  }, [doc, page, zoom, width]);

  // ---- Naya page: upar se shuru + number box sync
  useEffect(() => {
    pageRef.current = page;
    setPageInput(String(page));
    stageRef.current?.scrollTo({ top: 0 });
  }, [page]);

  // ---- Pasand yaad rakho (theme, zoom)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { theme?: string; zoom?: number };
        if (p.theme && (THEMES as string[]).includes(p.theme)) setTheme(p.theme as Theme);
        if (typeof p.zoom === "number" && p.zoom >= ZOOM_MIN && p.zoom <= ZOOM_MAX) setZoom(p.zoom);
      }
    } catch { /* ignore */ }
    setPrefsReady(true);
  }, []);
  useEffect(() => {
    if (!prefsReady) return;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, zoom })); } catch { /* ignore */ }
  }, [prefsReady, theme, zoom]);

  // ---- Fullscreen
  useEffect(() => {
    setCanFs(typeof document.documentElement.requestFullscreen === "function");
    const f = () => setIsFs(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  // ---- Progress save (1.5 sec ruk kar; tab chhupne par turant)
  const saveNow = useCallback(() => {
    if (numPages === 0 || pageRef.current === savedRef.current) return;
    const p = pageRef.current;
    savedRef.current = p;
    void saveBookProgress(bookId, p, Math.round((p / numPages) * 100)).catch(() => {});
  }, [bookId, numPages]);
  useEffect(() => {
    if (!doc) return;
    const t = window.setTimeout(saveNow, 1500);
    return () => window.clearTimeout(t);
  }, [doc, page, saveNow]);
  useEffect(() => {
    const h = () => { if (document.visibilityState === "hidden") saveNow(); };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [saveNow]);

  // ---- Navigation
  const next = useCallback(() => setPage((p) => Math.min(p + 1, numPages || p)), [numPages]);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  const jump = useCallback((raw: string) => {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < 1) { setPageInput(String(pageRef.current)); return; }
    setPage(Math.min(n, numPages || n));
  }, [numPages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchRef.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const s = touchRef.current;
    touchRef.current = null;
    const t = e.changedTouches[0];
    if (!s || !t || zoom > 1.05) return; // zoom hone par swipe = scroll, page nahi palatna
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) (dx < 0 ? next : prev)();
  };

  const zoomBy = (d: number) => setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + d) * 10) / 10)));
  const cycleTheme = () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  const toggleFs = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

  const pct = numPages ? (page / numPages) * 100 : 0;

  return (
    <div ref={rootRef} className={`rdr rdr-${theme}`}>
      <div className="rdr-prog" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      <div className="rdr-top">
        <span className="rdr-title">{title}</span>
        {numPages > 0 && <span className="rdr-count">पेज {page} / {numPages}</span>}
      </div>

      <div ref={stageRef} className="rdr-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {error ? (
          <div className="rdr-msg">
            <b>Book यहाँ नहीं खुल पाई</b>
            <p>Internet जाँचो और पेज दोबारा खोलो। फिर भी न खुले तो नीचे वाला बटन दबाओ।</p>
            <a className="rdr-open" href={`/books/${bookId}/open`} target="_blank" rel="noopener noreferrer">नए Tab में खोलो</a>
          </div>
        ) : !doc ? (
          <div className="rdr-msg" role="status">
            <span className="rdr-spin" />
            <p>Book खुल रही है{loadPct > 0 ? ` • ${loadPct}%` : "…"}</p>
          </div>
        ) : null}
        <div className="rdr-sheet" style={{ visibility: doc ? "visible" : "hidden" }}>
          <canvas ref={canvasRef} className="rdr-canvas" />
          {doc && rendering && <span className="rdr-busy" aria-hidden="true" />}
        </div>
      </div>

      {doc && (
        <div className="rdr-bar" role="toolbar" aria-label="Reader controls">
          <input
            className="rdr-scrub"
            type="range"
            min={1}
            max={Math.max(1, numPages)}
            value={Math.min(Math.max(1, Number(pageInput) || page), Math.max(1, numPages))}
            onChange={(e) => setPageInput(e.target.value)}
            onPointerUp={(e) => jump(e.currentTarget.value)}
            onKeyUp={(e) => jump(e.currentTarget.value)}
            aria-label="पेज स्लाइडर"
          />
          <button type="button" className="rdr-btn" onClick={prev} disabled={page <= 1} aria-label="पिछला पेज"><IcPrev /></button>
          <label className="rdr-pg">
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onBlur={(e) => jump(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              aria-label="पेज नंबर"
            />
            <span>/ {numPages}</span>
          </label>
          <button type="button" className="rdr-btn" onClick={next} disabled={page >= numPages} aria-label="अगला पेज"><IcNext /></button>
          <span className="rdr-sep" />
          <button type="button" className="rdr-btn" onClick={() => zoomBy(-0.2)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom कम"><IcMinus /></button>
          <button type="button" className="rdr-zoom" onClick={() => setZoom(1)} aria-label="Zoom वापस 100%">{Math.round(zoom * 100)}%</button>
          <button type="button" className="rdr-btn" onClick={() => zoomBy(0.2)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom ज़्यादा"><IcPlus /></button>
          <span className="rdr-sep" />
          <button type="button" className="rdr-btn rdr-wide" onClick={cycleTheme} aria-label={`Theme: ${THEME_LABEL[theme]}`}><IcTheme /><span>{THEME_LABEL[theme]}</span></button>
          {canFs && (
            <button type="button" className="rdr-btn" onClick={toggleFs} aria-label={isFs ? "Fullscreen बंद" : "Fullscreen"}>
              {isFs ? <IcExit /> : <IcFull />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
EOF_PDF_READER

# ---------------------------------------------------------------- components/books/pdf-reader.css
cat > components/books/pdf-reader.css <<'EOF_PDF_CSS'
/* Reader: chrome hamesha gehra hara-kaala; sirf "mez" (stage) ka rang theme se badalta hai. */
.rdr {
  --rd-panel: rgba(10, 20, 14, 0.92);
  --rd-line: rgba(255, 255, 255, 0.09);
  --rd-text: #e8f3ec;
  --rd-mute: #8fa597;
  --rd-acc: #34d399;
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 190px);
  min-height: 460px;
  background: var(--rd-stage);
  border: 1px solid var(--rd-line);
  border-radius: 16px;
  overflow: hidden;
  color: var(--rd-text);
}
.rdr-light { --rd-stage: #1b2621; }
.rdr-sepia { --rd-stage: #3b3327; }
.rdr-night { --rd-stage: #020403; }
.rdr:fullscreen { height: 100dvh; border-radius: 0; border: 0; }

.rdr-prog { position: absolute; inset: 0 0 auto 0; height: 3px; background: rgba(255, 255, 255, 0.08); z-index: 3; }
.rdr-prog i { display: block; height: 100%; background: var(--rd-acc); transition: width 0.25s ease; }

.rdr-top {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding: 12px 14px 8px; background: var(--rd-panel); border-bottom: 1px solid var(--rd-line);
}
.rdr-title { font-size: 14px; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdr-count { font-size: 12.5px; color: var(--rd-mute); white-space: nowrap; font-variant-numeric: tabular-nums; }

.rdr-stage { position: relative; flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.rdr-sheet { position: relative; width: max-content; margin: 0 auto; padding: 12px; }
.rdr-canvas { display: block; background: #fff; border-radius: 3px; box-shadow: 0 12px 34px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.25); }
.rdr-sepia .rdr-canvas { filter: sepia(0.4) brightness(0.97) contrast(0.96); }
.rdr-night .rdr-canvas { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.92); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08); }

.rdr-busy { position: absolute; top: 18px; right: 18px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.25); border-top-color: var(--rd-acc); background: rgba(0, 0, 0, 0.35); animation: rdr-spin 0.8s linear infinite; }
.rdr-spin { width: 28px; height: 28px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.2); border-top-color: var(--rd-acc); animation: rdr-spin 0.8s linear infinite; }
@keyframes rdr-spin { to { transform: rotate(360deg); } }

.rdr-msg { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 24px; text-align: center; z-index: 2; }
.rdr-msg p { color: var(--rd-mute); font-size: 13.5px; max-width: 34ch; }
.rdr-open { margin-top: 4px; padding: 10px 16px; border-radius: 12px; background: var(--rd-acc); color: #022c22; font-weight: 600; font-size: 14px; text-decoration: none; }

.rdr-bar {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--rd-panel); border-top: 1px solid var(--rd-line); backdrop-filter: blur(12px);
}
.rdr-scrub { flex: 1 1 100%; width: 100%; height: 24px; margin: 0 0 2px; accent-color: var(--rd-acc); }
.rdr-btn, .rdr-zoom {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 40px; height: 40px; padding: 0 10px; border: 0; border-radius: 12px;
  background: rgba(255, 255, 255, 0.07); color: var(--rd-text); font: inherit; font-size: 13px; cursor: pointer;
}
.rdr-btn:hover:not(:disabled), .rdr-zoom:hover { background: rgba(255, 255, 255, 0.14); }
.rdr-btn:disabled { opacity: 0.35; cursor: default; }
.rdr-zoom { min-width: 54px; font-variant-numeric: tabular-nums; }
.rdr-wide { padding: 0 12px; }
.rdr-pg { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--rd-mute); font-variant-numeric: tabular-nums; }
.rdr-pg input {
  width: 54px; height: 40px; text-align: center; border-radius: 12px; border: 1px solid var(--rd-line);
  background: rgba(0, 0, 0, 0.35); color: var(--rd-text); font: inherit; font-size: 14px;
}
.rdr-sep { width: 1px; height: 22px; background: var(--rd-line); }
.rdr button:focus-visible, .rdr input:focus-visible, .rdr a:focus-visible { outline: 2px solid var(--rd-acc); outline-offset: 2px; }

@media (max-width: 480px) { .rdr-sep { display: none; } .rdr-wide span { display: none; } }
@media (prefers-reduced-motion: reduce) { .rdr-busy, .rdr-spin { animation-duration: 2.4s; } .rdr-prog i { transition: none; } }
EOF_PDF_CSS

# ---------------------------------------------------------------- app/books/[id]/read/page.tsx
cat > "app/books/[id]/read/page.tsx" <<'EOF_READ_PAGE'
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookCover from "@/components/books/BookCover";
import PdfReader from "@/components/books/PdfReader";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { embedUrl, parseBookLink } from "@/lib/book-links";
import { MEDIUM_LABEL, type BookMedium } from "@/lib/book-meta";
import type { Book } from "@/types/database";

export const metadata: Metadata = { title: "Book पढ़ो" };
export const dynamic = "force-dynamic";

// Book isi website ke andar khulti hai. Login zaroori.
// Upload ki hui PDF: apna reader (page-by-page). Drive/Mega jaise links: pehle ki tarah iframe.
export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/books/${id}/read`)}`);

  const supabase = await createClient();
  // select("*") taaki migration 012 se pehle bhi page na toote
  const { data } = await supabase.from("books").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  const row = data as Book | null;
  if (!row) redirect("/books");

  let src: string | null = null;
  let isPdf = false;
  if (row.storage_path) {
    const signed = await supabase.storage.from("books").createSignedUrl(row.storage_path, 3600);
    src = signed.data?.signedUrl ?? null;
    isPdf = !!src;
  } else {
    const link = row.external_url ? parseBookLink(row.external_url) : null;
    if (link) src = embedUrl(link.source, link.url);
  }

  // Pichhla padha hua page (resume ke liye). Column na ho to bhi page nahi toot-ta.
  const { data: act } = await supabase
    .from("user_book_activity")
    .select("last_page")
    .eq("user_id", user.id)
    .eq("book_id", id)
    .maybeSingle();
  const lastPage = Math.max(1, Math.floor(Number((act as { last_page: number | null } | null)?.last_page ?? 1)) || 1);

  // Profile ke "Continue Learning" ke liye haal hi kholi gayi book yaad rakho.
  await supabase.from("user_book_activity").upsert(
    { user_id: user.id, book_id: id, last_opened_at: new Date().toISOString() },
    { onConflict: "user_id,book_id" },
  );

  const medium = row.medium && row.medium in MEDIUM_LABEL ? MEDIUM_LABEL[row.medium as BookMedium] : null;
  const meta = [row.author, medium, row.exam, row.pages ? `${row.pages} पेज` : null, row.publisher, row.edition].filter(Boolean).join(" • ");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="su-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Link className="su-btn su-btn-ghost" href="/books">← Books</Link>
        <a className="su-btn su-btn-ghost" href={`/books/${id}/open`} target="_blank" rel="noopener noreferrer">↗ नए Tab में खोलो</a>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <BookCover path={row.cover_path} title={row.title} width={64} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>{row.title}</h1>
          {meta && <p className="su-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{meta}</p>}
        </div>
      </div>
      {row.description && <p className="su-muted" style={{ fontSize: 13 }}>{row.description}</p>}
      {src && isPdf ? (
        <PdfReader key={src} bookId={id} src={src} title={row.title} initialPage={lastPage} />
      ) : src ? (
        <iframe
          src={src}
          title={row.title}
          allow="fullscreen"
          referrerPolicy="no-referrer"
          style={{ width: "100%", height: "calc(100dvh - 180px)", minHeight: 480, border: 0, borderRadius: 12, background: "#fff" }}
        />
      ) : (
        <p className="su-muted">
          इस Link की Book यहाँ नहीं खुल सकती। ऊपर “नए Tab में खोलो” दबाओ।
        </p>
      )}
    </div>
  );
}
EOF_READ_PAGE

echo "== typecheck (galti hui to yahin ruk jayega, commit nahi hoga) =="
npm run typecheck

git add \
  package.json \
  next.config.ts \
  types/pdfjs.d.ts \
  components/books/PdfReader.tsx \
  components/books/pdf-reader.css \
  "app/books/[id]/read/page.tsx"

echo "== commit hone wali badlav =="
git status --short

git commit -m "feat: premium PDF reader (page-by-page, zoom, themes, swipe, resume, progress)"
git push -u origin feat/premium-pdf-reader
echo "== ho gaya. Ab GitHub par PR kholo, Vercel preview me ek PDF kholkar test karo =="

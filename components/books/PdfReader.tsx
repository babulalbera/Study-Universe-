"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as RMouseEvent, type TouchEvent as RTouchEvent } from "react";
import { saveBookProgress } from "@/features/profile/dashboard/progress-actions";
import "./pdf-reader.css";

/* ---- pdf.js ke chhote types (taaki lint/type ka jhanjhat na ho) ---- */
type RenderTask = { promise: Promise<void>; cancel: () => void };
type Viewport = { width: number; height: number };
type PageProxy = {
  getViewport: (o: { scale: number }) => Viewport;
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: Viewport }) => RenderTask;
};
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PageProxy>; destroy: () => Promise<void> };
type LoadingTask = { promise: Promise<PdfDoc>; destroy: () => Promise<void>; onProgress?: (p: { loaded: number; total?: number }) => void };
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { url: string; disableAutoFetch?: boolean }) => LoadingTask;
};

type Theme = "paper" | "sepia" | "night";
type Mode = "book" | "slide" | "scroll";
const THEMES: Theme[] = ["paper", "sepia", "night"];
const THEME_LABEL: Record<Theme, string> = { paper: "Paper", sepia: "Sepia", night: "Night" };
const MODE_KEY = "su-pdf-mode";
const PAD = 12; // stage ke andar kinara
const GAP = 14; // Scroll mode me do page ke beech ki jagah

/* ---- Icons ---- */
const sv = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcBack = () => <svg {...sv}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
const IcBook = () => <svg {...sv}><path d="M3 5.5C5.5 4.3 8.5 4.3 12 6c3.5-1.7 6.5-1.7 9-.5V19c-2.5-1.2-5.5-1.2-9 .5-3.5-1.7-6.5-1.7-9-.5V5.5Z" /><path d="M12 6v13.5" /></svg>;
const IcSlide = () => <svg {...sv}><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" /></svg>;
const IcScroll = () => <svg {...sv}><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" /></svg>;
const IcTheme = () => <svg {...sv}><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" /></svg>;
const IcFull = () => <svg {...sv}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
const IcExit = () => <svg {...sv}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: "book", label: "Book", icon: <IcBook /> },
  { id: "slide", label: "Slide", icon: <IcSlide /> },
  { id: "scroll", label: "Scroll", icon: <IcScroll /> },
];

/* ---- Page renderer: cache + ek saath sirf 2 render + pehle se tayyar (prefetch) ---- */
type Rendered = { canvas: HTMLCanvasElement; w: number; h: number };
type Renderer = { get: (num: number, width: number, prefetch?: boolean) => Promise<Rendered | null> };

function createRenderer(doc: PdfDoc): Renderer {
  const cache = new Map<string, Rendered>();
  const pending = new Map<string, Promise<Rendered | null>>();
  const queue: (() => void)[] = [];
  let active = 0;
  const MAX_ACTIVE = 2;
  const PIXEL_BUDGET = 48_000_000;
  const MAX_ENTRIES = 16;

  const pump = () => {
    while (active < MAX_ACTIVE && queue.length > 0) {
      const job = queue.pop(); // sabse naya maanga hua pehle
      if (!job) break;
      active++;
      job();
    }
  };

  const evict = () => {
    let px = 0;
    cache.forEach((r) => { px += r.canvas.width * r.canvas.height; });
    for (const [k, r] of cache) {
      if (px <= PIXEL_BUDGET && cache.size <= MAX_ENTRIES) break;
      px -= r.canvas.width * r.canvas.height;
      cache.delete(k);
    }
  };

  const run = async (num: number, width: number): Promise<Rendered | null> => {
    try {
      const page = await doc.getPage(num);
      const base = page.getViewport({ scale: 1 });
      const cssH = (base.height / base.width) * width;
      const maxDpr = Math.sqrt(10_000_000 / (width * cssH));
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, maxDpr));
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      return { canvas, w: canvas.width / dpr, h: canvas.height / dpr };
    } catch {
      return null;
    }
  };

  return {
    get(num, width, prefetch = false) {
      const w = Math.max(80, Math.round(width));
      const key = `${num}@${w}`;
      const hit = cache.get(key);
      if (hit) {
        cache.delete(key);
        cache.set(key, hit);
        return Promise.resolve(hit);
      }
      const inflight = pending.get(key);
      if (inflight) return inflight;
      const p = new Promise<Rendered | null>((resolve) => {
        const job = () => {
          void run(num, w).then((r) => {
            active--;
            pending.delete(key);
            if (r) {
              cache.set(key, r);
              evict();
            }
            resolve(r);
            pump();
          });
        };
        if (prefetch) queue.unshift(job);
        else queue.push(job);
      });
      pending.set(key, p);
      pump();
      return p;
    },
  };
}

/* ---- Ek page ek canvas par (naya page aane tak purana dikhta rehta hai: flicker nahi) ---- */
function PageCanvas({ rend, num, width, onSize }: { rend: Renderer; num: number; width: number; onSize?: (n: number, w: number, h: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (width < 80) return;
    let dead = false;
    void rend.get(num, width).then((r) => {
      if (dead || !r) return;
      const cv = ref.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      cv.width = r.canvas.width;
      cv.height = r.canvas.height;
      cv.style.width = `${r.w}px`;
      cv.style.height = `${r.h}px`;
      ctx.drawImage(r.canvas, 0, 0);
      onSize?.(num, r.w, r.h);
    });
    return () => {
      dead = true;
    };
  }, [rend, num, width, onSize]);

  return <canvas ref={ref} className="pdfr-canvas" aria-label={`Page ${num}`} />;
}

type Props = { src: string; title: string; bookId: string; fallback?: string | null };

export default function PdfReader({ src, title, bookId, fallback = null }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const live = useRef<{ mode: Mode; page: number; total: number; offsetOf: (n: number) => number }>({ mode: "book", page: 1, total: 0, offsetOf: () => 0 });
  const jumpRef = useRef<{ page: number; smooth: boolean } | null>(null);
  const flipRef = useRef<"next" | "prev" | null>(null);
  const ignoreUntil = useRef(0);
  const rafRef = useRef(0);
  const ratios = useRef(new Map<number, number>());
  const ratio0Ref = useRef(1.414);
  const savedRef = useRef(0);

  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("paper");
  const [mode, setMode] = useState<Mode>("book");
  const [ratio0, setRatio0] = useState(1.414);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [failed, setFailed] = useState(false);
  const [restored, setRestored] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [jump, setJump] = useState("1");
  const [full, setFull] = useState(false);
  const [canFs, setCanFs] = useState(false);
  const [chrome, setChrome] = useState(true); // toolbar dikhe ya chhupe (beech me tap)
  const [, setBump] = useState(0);

  const storeKey = `su-pdf:${bookId}`;

  // Sabse pehle: taaki baad ke effects ko hamesha taaza value mile
  useEffect(() => {
    live.current.mode = mode;
    live.current.page = page;
    live.current.total = total;
  });

  /* 0) Phone par reader poori screen hai: peeche ka page scroll na ho */
  useEffect(() => {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* 1) PDF load + pichhli baar ka page/theme/zoom/mode wapas */
  useEffect(() => {
    let dead = false;
    let task: LoadingTask | null = null;
    (async () => {
      try {
        const lib = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJs;
        // Worker file public/fonts/ mein rakhi hai (middleware us folder ko chhodta hai)
        lib.GlobalWorkerOptions.workerSrc = "/fonts/pdf.worker.min.mjs";
        // Apni site ke raaste (Drive/Mega) par sirf zaroori hissa mangao: server ka bandwidth bachta hai
        task = lib.getDocument({ url: src, disableAutoFetch: src.startsWith("/") });
        task.onProgress = (p) => {
          if (!dead && p.total) setLoadPct(Math.min(100, Math.round((p.loaded / p.total) * 100)));
        };
        const doc = await task.promise;
        if (dead) {
          void doc.destroy();
          return;
        }
        const first = await doc.getPage(1);
        const v = first.getViewport({ scale: 1 });
        if (dead) {
          void doc.destroy();
          return;
        }
        let saved: { page?: number; zoom?: number; theme?: Theme } = {};
        try {
          saved = JSON.parse(localStorage.getItem(storeKey) ?? "{}");
        } catch {
          /* kharab data ignore */
        }
        let savedMode: string | null = null;
        try {
          savedMode = localStorage.getItem(MODE_KEY);
        } catch {
          /* private mode */
        }
        const startPage = Math.min(Math.max(Number(saved.page) || 1, 1), doc.numPages);
        ratio0Ref.current = v.height / v.width;
        savedRef.current = startPage;
        setRatio0(v.height / v.width);
        setTotal(doc.numPages);
        setPage(startPage);
        if (saved.theme && THEMES.includes(saved.theme)) setTheme(saved.theme);
        if (saved.zoom && saved.zoom >= 1 && saved.zoom <= 3) setZoom(saved.zoom);
        if (savedMode === "book" || savedMode === "slide" || savedMode === "scroll") setMode(savedMode);
        setPdf(doc);
        setRestored(true);
      } catch {
        if (!dead) setFailed(true);
      }
    })();
    return () => {
      dead = true;
      void task?.destroy();
    };
  }, [src, storeKey]);

  /* 2) Har badlav yaad rakho (page, zoom, theme: is book ke liye) */
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ page, zoom, theme }));
    } catch {
      /* private mode */
    }
  }, [restored, page, zoom, theme, storeKey]);

  /* 3) Stage ki naap */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [failed]);

  useEffect(() => {
    setCanFs(typeof document.documentElement.requestFullscreen === "function");
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const rend = useMemo(() => (pdf ? createRenderer(pdf) : null), [pdf]);

  /* ---- Naap-tol ---- */
  const availW = Math.max(0, box.w - PAD * 2);
  const availH = Math.max(0, box.h - PAD * 2);
  const spread = mode === "book" && availW >= 860 && total > 1;
  const step = spread ? 2 : 1;
  const left = spread && page % 2 === 0 ? page - 1 : page;
  const right = spread && left + 1 <= total ? left + 1 : null;
  const fitW = spread ? Math.floor((availW - 2) / 2) : availW;
  const fitH = Math.floor(availH / ratio0); // itni chaudai par poora page (upar se neeche) dikhta hai
  const baseW = mode === "scroll" ? Math.min(availW, 820) : Math.min(fitW, fitH);
  const pageW = Math.max(0, Math.floor(baseW * zoom));

  const heightOf = (n: number) => Math.round(pageW * (ratios.current.get(n) ?? ratio0Ref.current));
  const offsetOf = (n: number) => {
    let y = PAD;
    for (let i = 1; i < n; i++) y += heightOf(i) + GAP;
    return y;
  };
  useEffect(() => {
    live.current.offsetOf = offsetOf;
  });

  const onSize = useCallback((n: number, w: number, h: number) => {
    const r = h / w;
    const est = ratios.current.get(n) ?? ratio0Ref.current;
    ratios.current.set(n, r);
    if (Math.abs(est - r) > 0.004) setBump((b) => b + 1); // is page ka asli size alag nikla: layout theek karo
  }, []);

  /* ---- Scroll / Slide ko sahi jagah le jao ---- */
  const alignTo = useCallback((p: number, smooth: boolean) => {
    const st = stageRef.current;
    if (!st) return;
    ignoreUntil.current = Date.now() + (smooth ? 700 : 250);
    const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
    const m = live.current.mode;
    if (m === "scroll") {
      st.scrollTo({ top: live.current.offsetOf(p), behavior });
    } else if (m === "slide") {
      const el = slidesRef.current;
      if (el) el.scrollTo({ left: (p - 1) * el.clientWidth, behavior });
    } else {
      st.scrollTo({ top: 0, left: 0 });
    }
  }, []);

  // Mode / chaudai / zoom badle to wahi page par wapas aao
  useEffect(() => {
    if (!pdf) return;
    alignTo(live.current.page, false);
  }, [pdf, mode, box.w, zoom, alignTo]);

  // Button / slider se page badla
  useEffect(() => {
    const j = jumpRef.current;
    if (!j || j.page !== page) return;
    jumpRef.current = null;
    alignTo(page, j.smooth);
  }, [page, alignTo]);

  // Book mode: page palatne ka halka effect
  useEffect(() => {
    const f = flipRef.current;
    flipRef.current = null;
    const el = bookRef.current;
    if (!f || !el || live.current.mode !== "book") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.style.transformOrigin = f === "next" ? "left center" : "right center";
    el.animate(
      [
        { opacity: 0.35, transform: `perspective(1600px) rotateY(${f === "next" ? -14 : 14}deg) translateX(${f === "next" ? 26 : -26}px)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
  }, [page]);

  const goTo = useCallback(
    (n: number, dir?: "next" | "prev") => {
      if (!total) return;
      let t = Math.min(Math.max(Math.round(n), 1), total);
      if (spread && t % 2 === 0) t -= 1;
      if (t === left) return;
      flipRef.current = dir ?? (t > left ? "next" : "prev");
      jumpRef.current = { page: t, smooth: Math.abs(t - left) <= 1 };
      setPage(t);
    },
    [total, spread, left],
  );

  useEffect(() => setJump(String(left)), [left]);

  /* ---- Aas-paas ke page pehle se tayyar karo ---- */
  useEffect(() => {
    if (!rend || !pageW || mode === "scroll") return;
    for (const d of [1, -1, 2]) {
      const a = left + d * step;
      for (const n of spread ? [a, a + 1] : [a]) {
        if (n >= 1 && n <= total) void rend.get(n, pageW, true);
      }
    }
  }, [rend, pageW, mode, left, step, spread, total]);

  /* ---- Progress server par save (Profile ke Continue Learning ke liye) ---- */
  const saveNow = useCallback(() => {
    const p = live.current.page;
    const t = live.current.total;
    if (!t || p === savedRef.current) return;
    savedRef.current = p;
    void saveBookProgress(bookId, p, Math.round((p / t) * 100)).catch(() => {});
  }, [bookId]);
  useEffect(() => {
    if (!restored) return;
    const id = window.setTimeout(saveNow, 1500);
    return () => window.clearTimeout(id);
  }, [restored, page, saveNow]);
  useEffect(() => {
    const h = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [saveNow]);

  /* ---- Keyboard: ← → ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") goTo(left + step, "next");
      if (e.key === "ArrowLeft") goTo(left - step, "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, left, step]);

  /* ---- Scroll mode: abhi kaun sa page dikh raha hai ---- */
  const onStageScroll = () => {
    if (mode !== "scroll" || rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const st = stageRef.current;
      if (!st || Date.now() < ignoreUntil.current) return;
      const y = st.scrollTop + st.clientHeight * 0.3;
      let acc = PAD;
      let found = total;
      for (let i = 1; i <= total; i++) {
        acc += heightOf(i) + GAP;
        if (acc > y) {
          found = i;
          break;
        }
      }
      setPage((p) => (p === found ? p : found));
    });
  };

  /* ---- Slide mode: kaun si slide par ruke ---- */
  const onSlideScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = slidesRef.current;
      if (!el || !el.clientWidth || Date.now() < ignoreUntil.current) return;
      const idx = Math.min(Math.max(Math.round(el.scrollLeft / el.clientWidth) + 1, 1), total);
      setPage((p) => (p === idx ? p : idx));
    });
  };

  /* ---- Book mode: swipe; tap: kinara = page palto, beech = buttons chhupao/dikhao ---- */
  const onTouchStart = (e: RTouchEvent<HTMLDivElement>) => {
    if (mode !== "book") return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: RTouchEvent<HTMLDivElement>) => {
    const s = touch.current;
    touch.current = null;
    if (mode !== "book" || !s || zoom > 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 60) goTo(dx < 0 ? left + step : left - step, dx < 0 ? "next" : "prev");
  };
  const onStageClick = (e: RMouseEvent<HTMLDivElement>) => {
    if (window.getSelection()?.toString()) return;
    if (mode === "book" && zoom <= 1) {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      if (x < 0.22) {
        goTo(left - step, "prev");
        return;
      }
      if (x > 0.78) {
        goTo(left + step, "next");
        return;
      }
    }
    setChrome((c) => !c);
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* private mode */
    }
  };
  const cycleTheme = () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  };
  const commitJump = (raw: string) => {
    const n = Number(raw);
    if (n >= 1) goTo(n);
    else setJump(String(left));
  };

  const nums = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);

  /* Reader PDF na khol paye (link public nahi, bahut badi file, ...) to purana iframe / naya Tab */
  if (failed) {
    return (
      <div className="pdfr pdfr-plain" role="region" aria-label={title}>
        <div className="pdfr-bar">
          <Link href="/books" className="pdfr-btn pdfr-back" aria-label="Books par wapas">
            <IcBack />
          </Link>
          <span className="pdfr-fail-title">{title}</span>
          <a className="pdfr-btn pdfr-open" href={`/books/${bookId}/open`} target="_blank" rel="noopener noreferrer">
            ↗ Naye Tab me
          </a>
        </div>
        {fallback ? (
          <iframe className="pdfr-frame" src={fallback} title={title} allow="fullscreen" referrerPolicy="no-referrer" />
        ) : (
          <p className="pdfr-fail-msg">Ye book yahan nahi khul payi. Upar “Naye Tab me” dabao.</p>
        )}
      </div>
    );
  }

  const progress = total ? (left / total) * 100 : 0;
  const atStart = left <= 1;
  const atEnd = (right ?? left) >= total;

  return (
    <div ref={wrapRef} className={`pdfr${chrome ? "" : " chrome-off"}`} data-theme={theme} data-full={full || undefined} role="region" aria-label={title}>
      <div className="pdfr-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="pdfr-bar">
        <Link href="/books" className="pdfr-btn pdfr-back" aria-label="Books par wapas">
          <IcBack />
        </Link>
        <div className="pdfr-seg" role="tablist" aria-label="Padhne ka tareeka">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              className={`pdfr-seg-btn${mode === m.id ? " on" : ""}`}
              onClick={() => switchMode(m.id)}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <div className="pdfr-group">
          <button type="button" className="pdfr-btn" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} aria-label="Zoom kam karo">
            −
          </button>
          <span className="pdfr-zoom">{Math.round(zoom * 100)}%</span>
          <button type="button" className="pdfr-btn" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} disabled={zoom >= 3} aria-label="Zoom badhao">
            +
          </button>
        </div>
        <div className="pdfr-group">
          <button type="button" className="pdfr-btn pdfr-btn-text" onClick={cycleTheme} aria-label="Reading mode badlo">
            <IcTheme />
            <span>{THEME_LABEL[theme]}</span>
          </button>
          {canFs && (
            <button type="button" className="pdfr-btn pdfr-fsbtn" onClick={toggleFull} aria-label={full ? "Full screen band" : "Full screen"}>
              {full ? <IcExit /> : <IcFull />}
            </button>
          )}
        </div>
      </div>

      <div
        ref={stageRef}
        className={`pdfr-stage is-${mode}`}
        onScroll={onStageScroll}
        onClick={onStageClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {!pdf && <p className="pdfr-loading">Book khul rahi hai{loadPct > 0 ? ` • ${loadPct}%` : "…"}</p>}

        {pdf && rend && mode === "book" && (
          <div ref={bookRef} className={`pdfr-pages${spread ? " is-spread" : ""}`}>
            <div className={`pdfr-leaf${spread ? " is-left" : ""}`}>
              <PageCanvas rend={rend} num={left} width={pageW} onSize={onSize} />
            </div>
            {right && (
              <div className="pdfr-leaf is-right">
                <PageCanvas rend={rend} num={right} width={pageW} onSize={onSize} />
              </div>
            )}
          </div>
        )}

        {pdf && rend && mode === "scroll" && (
          <div className="pdfr-scroll" style={{ width: pageW, padding: `${PAD}px 0` }}>
            {nums.map((n) => (
              <div key={n} className="pdfr-leaf" style={{ width: pageW, height: heightOf(n), marginBottom: n === total ? 0 : GAP }}>
                {Math.abs(n - page) <= 2 && <PageCanvas rend={rend} num={n} width={pageW} onSize={onSize} />}
              </div>
            ))}
          </div>
        )}

        {pdf && rend && mode === "slide" && (
          <div ref={slidesRef} className={`pdfr-slides${zoom > 1 ? " is-zoom" : ""}`} onScroll={onSlideScroll}>
            {nums.map((n) => (
              <div key={n} className="pdfr-slide">
                {Math.abs(n - page) <= 1 && (
                  <div className="pdfr-leaf">
                    <PageCanvas rend={rend} num={n} width={pageW} onSize={onSize} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pdfr-nav">
        <input
          className="pdfr-scrub"
          type="range"
          min={1}
          max={Math.max(1, total)}
          value={Math.min(Math.max(Number(jump) || left, 1), Math.max(1, total))}
          onChange={(e) => setJump(e.target.value)}
          onPointerUp={(e) => commitJump(e.currentTarget.value)}
          onKeyUp={(e) => commitJump(e.currentTarget.value)}
          aria-label="Page slider"
          disabled={!pdf}
        />
        <button type="button" className="pdfr-btn" onClick={() => goTo(left - step, "prev")} disabled={atStart} aria-label="Pichhla page">
          ‹
        </button>
        <label className="pdfr-jump">
          <input
            inputMode="numeric"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitJump(jump);
                (e.target as HTMLInputElement).blur();
              }
            }}
            onBlur={() => setJump(String(left))}
            aria-label="Page number"
          />
          <span>/ {total || "–"}</span>
        </label>
        <button type="button" className="pdfr-btn" onClick={() => goTo(left + step, "next")} disabled={atEnd} aria-label="Agla page">
          ›
        </button>
      </div>
    </div>
  );
}

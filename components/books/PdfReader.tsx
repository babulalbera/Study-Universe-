"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./pdf-reader.css";

/* ---- pdf.js ke chhote types (taaki lint/type ka jhanjhat na ho) ---- */
type RenderTask = { promise: Promise<void>; cancel: () => void };
type Viewport = { width: number; height: number };
type PageProxy = {
  getViewport: (o: { scale: number }) => Viewport;
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: Viewport }) => RenderTask;
};
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PageProxy>; destroy: () => Promise<void> };
type LoadingTask = { promise: Promise<PdfDoc>; destroy: () => Promise<void> };
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { url: string }) => LoadingTask;
};

type Theme = "paper" | "sepia" | "night";
const THEMES: Theme[] = ["paper", "sepia", "night"];
const THEME_LABEL: Record<Theme, string> = { paper: "Paper", sepia: "Sepia", night: "Night" };

/* ---- Ek page ek canvas par ---- */
function PageCanvas({ pdf, num, width }: { pdf: PdfDoc; num: number; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (width < 80) return;
    let dead = false;
    let task: RenderTask | null = null;
    (async () => {
      try {
        const page = await pdf.getPage(num);
        if (dead) return;
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const base = page.getViewport({ scale: 1 });
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const vp = page.getViewport({ scale: (width / base.width) * dpr });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${vp.height / dpr}px`;
        task = page.render({ canvasContext: ctx, viewport: vp });
        await task.promise;
      } catch {
        /* cancel hua render ignore */
      }
    })();
    return () => {
      dead = true;
      task?.cancel();
    };
  }, [pdf, num, width]);

  return <canvas ref={ref} className="pdfr-canvas" aria-label={`Page ${num}`} />;
}

type Props = { src: string; title: string; bookId: string };

export default function PdfReader({ src, title, bookId }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("paper");
  const [boxW, setBoxW] = useState(0);
  const [failed, setFailed] = useState(false);
  const [restored, setRestored] = useState(false);
  const [flip, setFlip] = useState<{ dir: "next" | "prev"; n: number }>({ dir: "next", n: 0 });
  const [jump, setJump] = useState("1");
  const [full, setFull] = useState(false);

  const storeKey = `su-pdf:${bookId}`;

  /* 1) PDF load + pichhli baar ka page/theme/zoom wapas */
  useEffect(() => {
    let dead = false;
    let task: LoadingTask | null = null;
    (async () => {
      try {
        const lib = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJs;
        // Worker file public/fonts/ mein rakhi hai (middleware us folder ko chhodta hai)
        lib.GlobalWorkerOptions.workerSrc = "/fonts/pdf.worker.min.mjs";
        task = lib.getDocument({ url: src });
        const doc = await task.promise;
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
        setTotal(doc.numPages);
        setPage(Math.min(Math.max(Number(saved.page) || 1, 1), doc.numPages));
        if (saved.theme && THEMES.includes(saved.theme)) setTheme(saved.theme);
        if (saved.zoom && saved.zoom >= 1 && saved.zoom <= 3) setZoom(saved.zoom);
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

  /* 2) Har badlav yaad rakho */
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ page, zoom, theme }));
    } catch {
      /* private mode */
    }
  }, [restored, page, zoom, theme, storeKey]);

  /* 3) Stage ki chaudai naapo */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setBoxW(Math.max(0, el.clientWidth - 24));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const spread = boxW >= 900 && total > 1;
  const step = spread ? 2 : 1;
  const left = spread && page % 2 === 0 ? page - 1 : page;
  const right = spread && left + 1 <= total ? left + 1 : null;

  const go = useCallback(
    (n: number, dir?: "next" | "prev") => {
      if (!total) return;
      let t = Math.min(Math.max(n, 1), total);
      if (spread && t % 2 === 0) t -= 1;
      if (t === left) return;
      setFlip((f) => ({ dir: dir ?? (t > left ? "next" : "prev"), n: f.n + 1 }));
      setPage(t);
      stageRef.current?.scrollTo({ top: 0 });
    },
    [total, spread, left],
  );

  useEffect(() => setJump(String(left)), [left]);

  /* Keyboard: ← → */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(left + step, "next");
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(left - step, "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, left, step]);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  };

  const cycleTheme = () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);

  /* Agar pdf.js khol na paye (jaise PDF nahi hai) to purana iframe wapas */
  if (failed) {
    return (
      <iframe
        src={src}
        title={title}
        allow="fullscreen"
        referrerPolicy="no-referrer"
        style={{ width: "100%", height: "calc(100dvh - 180px)", minHeight: 480, border: 0, borderRadius: 12, background: "#fff" }}
      />
    );
  }

  const pageW = Math.floor(((spread ? (boxW - 4) / 2 : boxW) || 0) * zoom);
  const progress = total ? (left / total) * 100 : 0;
  const atStart = left <= 1;
  const atEnd = (right ?? left) >= total;

  return (
    <div
      ref={wrapRef}
      className="pdfr"
      data-theme={theme}
      data-full={full || undefined}
      role="region"
      aria-label={title}
    >
      <div className="pdfr-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="pdfr-bar">
        <div className="pdfr-group">
          <button className="pdfr-btn" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} aria-label="Zoom kam karo">
            −
          </button>
          <span className="pdfr-zoom">{Math.round(zoom * 100)}%</span>
          <button className="pdfr-btn" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} disabled={zoom >= 3} aria-label="Zoom badhao">
            +
          </button>
        </div>
        <div className="pdfr-group">
          <button className="pdfr-btn pdfr-btn-text" onClick={cycleTheme} aria-label="Reading mode badlo">
            {THEME_LABEL[theme]}
          </button>
          <button className="pdfr-btn pdfr-btn-text" onClick={toggleFull} aria-label="Full screen">
            {full ? "Band" : "Full"}
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="pdfr-stage"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touch.current;
          touch.current = null;
          if (!s || zoom > 1) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) > 60 && Math.abs(dy) < 50) go(dx < 0 ? left + step : left - step, dx < 0 ? "next" : "prev");
        }}
      >
        {!pdf && <p className="pdfr-loading">Book khul rahi hai…</p>}
        {pdf && (
          <div key={flip.n} className={`pdfr-pages${spread ? " is-spread" : ""}`} data-flip={flip.n ? flip.dir : undefined}>
            <PageCanvas pdf={pdf} num={left} width={pageW} />
            {right && <PageCanvas pdf={pdf} num={right} width={pageW} />}
          </div>
        )}
      </div>

      <div className="pdfr-nav">
        <button className="pdfr-btn" onClick={() => go(left - step, "prev")} disabled={atStart} aria-label="Pichhla page">
          ‹
        </button>
        <label className="pdfr-jump">
          <input
            inputMode="numeric"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                go(Number(jump) || 1);
                (e.target as HTMLInputElement).blur();
              }
            }}
            onBlur={() => setJump(String(left))}
            aria-label="Page number"
          />
          <span>/ {total || "–"}</span>
        </label>
        <button className="pdfr-btn" onClick={() => go(left + step, "next")} disabled={atEnd} aria-label="Agla page">
          ›
        </button>
      </div>
    </div>
  );
}

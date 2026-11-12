"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as RMouseEvent, type TouchEvent as RTouchEvent } from "react";
import { saveBookProgress } from "@/features/profile/dashboard/progress-actions";
import PdfPanel from "./PdfPanel";
import { PageCanvas, createRenderer } from "./pdf-render";
import {
  IcBack, IcBookmark, IcExit, IcFull, IcMenu, IcSearch, IcTheme, MAX_ZOOM, MODES, THEMES, THEME_LABEL,
  type Hit, type LoadingTask, type Mark, type Mode, type PdfDoc, type PdfJs, type Tab, type Theme, type TocRow,
} from "./pdf-shared";
import { destToPage, findMarks, useOutline, useTextIndex } from "./pdf-tools";
import "./pdf-reader.css";

const MODE_KEY = "su-pdf-mode";
const PREFS_KEY = "su-pdf-prefs";
const PAD = 12; // stage ke andar kinara
const GAP = 14; // Scroll mode me do page ke beech ki jagah
const AUTO_HIDE_MS = 3500; // phone par toolbar itni der baad apne aap chhup jata hai
const DOUBLE_TAP_ZOOM = 2.5;

type Props = { src: string; title: string; bookId: string; fallback?: string | null };
type Anchor = { fx: number; fy: number; cx: number; cy: number; w: number; t: number };
type Pinch = { d0: number; z0: number; cx: number; cy: number; k: number };

export default function PdfReader({ src, title, bookId, fallback = null }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const scrollElRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const live = useRef<{ mode: Mode; page: number; total: number; offsetOf: (n: number) => number }>({ mode: "book", page: 1, total: 0, offsetOf: () => 0 });
  const jumpRef = useRef<{ page: number; smooth: boolean } | null>(null);
  const flipRef = useRef<"next" | "prev" | null>(null);
  const ignoreUntil = useRef(0);
  const rafRef = useRef(0);
  const ratios = useRef(new Map<number, number>());
  const ratio0Ref = useRef(1.414);
  const savedRef = useRef(0);
  const lastTap = useRef({ t: 0, x: 0, y: 0, chrome: true });
  const pinch = useRef<Pinch | null>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const suppressUntil = useRef(0);

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
  const [note, setNote] = useState<{ id: number; msg: string } | null>(null); // chhota message
  const [tick, setTick] = useState(0); // toolbar ko chhute hi auto-hide ki ghadi dobara shuru
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("pages");
  const [indexOn, setIndexOn] = useState(false); // search ka text-index tabhi banta hai jab pehli baar search khule
  const [query, setQuery] = useState("");
  const [hl, setHl] = useState<{ page: number; marks: Mark[] } | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [dim, setDim] = useState(0); // 0-60: screen kitni dhundhli
  const [, setBump] = useState(0);

  const storeKey = `su-pdf:${bookId}`;
  const bmKey = `su-pdf-bm:${bookId}`;
  const tell = useCallback((msg: string) => setNote({ id: Date.now(), msg }), []);

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
        let sv: { page?: number; zoom?: number; theme?: Theme } = {};
        try {
          sv = JSON.parse(localStorage.getItem(storeKey) ?? "{}");
        } catch {
          /* kharab data ignore */
        }
        let savedMode: string | null = null;
        try {
          savedMode = localStorage.getItem(MODE_KEY);
        } catch {
          /* private mode */
        }
        const startPage = Math.min(Math.max(Number(sv.page) || 1, 1), doc.numPages);
        ratio0Ref.current = v.height / v.width;
        savedRef.current = startPage;
        setRatio0(v.height / v.width);
        setTotal(doc.numPages);
        setPage(startPage);
        if (startPage > 1) setNote({ id: Date.now(), msg: `Page ${startPage} se aage padho 📖` });
        if (sv.theme && THEMES.includes(sv.theme)) setTheme(sv.theme);
        if (sv.zoom && sv.zoom >= 1 && sv.zoom <= MAX_ZOOM) setZoom(sv.zoom);
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

  /* Bookmarks + roshni ki pasand wapas */
  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(bmKey) ?? "[]");
      if (Array.isArray(raw)) setSaved(raw.filter((n): n is number => typeof n === "number").sort((a, b) => a - b));
    } catch {
      /* kharab data ignore */
    }
  }, [bmKey]);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as { dim?: number };
      if (typeof p.dim === "number") setDim(Math.min(60, Math.max(0, p.dim)));
    } catch {
      /* ignore */
    }
  }, []);
  const changeDim = (n: number) => {
    setDim(n);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ dim: n }));
    } catch {
      /* private mode */
    }
  };

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

  /* 4) Phone par: kuch der kuch na chhuo to toolbar apne aap chhup jaye (page ka size nahi badalta) */
  useEffect(() => {
    if (!pdf || !chrome || panelOpen) return;
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    const id = window.setTimeout(() => setChrome(false), AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [pdf, chrome, panelOpen, page, mode, zoom, theme, jump, tick]);

  /* 5) Chhota message 2.6 second baad hat jaye; search ka peela nishaan 9 second baad */
  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 2600);
    return () => window.clearTimeout(id);
  }, [note]);
  useEffect(() => {
    if (!hl) return;
    const id = window.setTimeout(() => setHl(null), 9000);
    return () => window.clearTimeout(id);
  }, [hl]);

  /* 6) Padhte waqt screen band na ho (jahan browser allow kare) */
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let dead = false;
    const ask = async () => {
      try {
        if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
        const l = await navigator.wakeLock.request("screen");
        if (dead) {
          void l.release().catch(() => {});
          return;
        }
        lock = l;
      } catch {
        /* browser ne allow nahi kiya: koi baat nahi */
      }
    };
    void ask();
    const onVis = () => {
      if (document.visibilityState === "visible") void ask();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => {});
    };
  }, []);

  const rend = useMemo(() => (pdf ? createRenderer(pdf) : null), [pdf]);
  const thumbRend = useMemo(() => (pdf ? createRenderer(pdf, 400) : null), [pdf]);
  const toc = useOutline(pdf);
  const index = useTextIndex(pdf, indexOn);
  const hits = useMemo(() => index.find(query), [index.find, query, index.version]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ---- Zoom: ungli ke point par tikta hai (pinch / double-tap / buttons) ---- */
  const clearPreview = useCallback(() => {
    for (const el of [bookRef.current, scrollElRef.current]) {
      if (el) {
        el.style.transform = "";
        el.style.transformOrigin = "";
      }
    }
  }, []);

  const applyAnchor = useCallback(() => {
    const a = anchorRef.current;
    const st = stageRef.current;
    anchorRef.current = null;
    clearPreview();
    if (!a || !st || Date.now() - a.t > 4000) return;
    st.scrollLeft = Math.max(0, a.fx * st.scrollWidth - a.cx);
    st.scrollTop = Math.max(0, a.fy * st.scrollHeight - a.cy);
  }, [clearPreview]);

  const setZoomAt = (next: number, cx?: number, cy?: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, +next.toFixed(2)));
    if (z === zoom) {
      clearPreview();
      return;
    }
    const st = stageRef.current;
    if (st && (mode === "book" || mode === "scroll")) {
      const px = cx ?? st.clientWidth / 2;
      const py = cy ?? st.clientHeight / 2;
      anchorRef.current = {
        fx: (st.scrollLeft + px) / Math.max(1, st.scrollWidth),
        fy: (st.scrollTop + py) / Math.max(1, st.scrollHeight),
        cx: px,
        cy: py,
        w: Math.floor(baseW * z),
        t: Date.now(),
      };
      window.setTimeout(clearPreview, 1800); // nayi taswir na aaye to bhi purana effect hat jaye
    }
    setZoom(z);
  };

  const onSize = useCallback(
    (n: number, w: number, h: number) => {
      const r = h / w;
      const est = ratios.current.get(n) ?? ratio0Ref.current;
      ratios.current.set(n, r);
      if (Math.abs(est - r) > 0.004) setBump((b) => b + 1); // is page ka asli size alag nikla: layout theek karo
      const a = anchorRef.current;
      if (a && Math.abs(w - a.w) < 3) applyAnchor(); // book mode: nayi taswir ban gayi, ab sahi jagah scroll karo
    },
    [applyAnchor],
  );

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

  // Mode / chaudai / zoom badle to wahi page par wapas aao (zoom ke baad: ungli wali jagah par)
  useEffect(() => {
    if (!pdf) return;
    if (anchorRef.current) {
      if (live.current.mode === "scroll") applyAnchor();
      else if (live.current.mode === "slide") {
        anchorRef.current = null;
        clearPreview();
      }
      return; // book mode: onSize nayi taswir aane par sahi jagah le jayega
    }
    alignTo(live.current.page, false);
  }, [pdf, mode, box.w, zoom, alignTo, applyAnchor, clearPreview]);

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
      try {
        navigator.vibrate?.(6); // page palatne par halka sa "tik"
      } catch {
        /* koi baat nahi */
      }
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

  /* ---- Menu (bottom sheet) ---- */
  const openPanel = (t: Tab) => {
    setTab(t);
    if (t === "search") setIndexOn(true);
    setPanelOpen(true);
  };
  const changeTab = (t: Tab) => {
    setTab(t);
    if (t === "search") setIndexOn(true);
  };
  const closePanel = () => setPanelOpen(false);

  const pickPage = (n: number) => {
    setPanelOpen(false);
    goTo(n);
  };
  const pickHit = (h: Hit) => {
    setPanelOpen(false);
    goTo(h.page);
    if (pdf) void findMarks(pdf, h.page, query).then((marks) => setHl({ page: h.page, marks }));
  };
  const pickToc = (r: TocRow) => {
    setPanelOpen(false);
    if (r.page) goTo(r.page);
    else if (pdf) void destToPage(pdf, r.dest).then((p) => (p ? goTo(p) : tell("Is entry ka page nahi mila")));
  };

  /* ---- Bookmark ---- */
  const isSaved = saved.includes(left) || (right !== null && saved.includes(right));
  const writeSaved = (next: number[]) => {
    setSaved(next);
    try {
      localStorage.setItem(bmKey, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };
  const toggleSaved = () => {
    const p = saved.includes(left) ? left : right !== null && saved.includes(right) ? right : left;
    if (saved.includes(p)) {
      writeSaved(saved.filter((x) => x !== p));
      tell(`Page ${p} ka bookmark hata diya`);
    } else {
      writeSaved([...saved, p].sort((a, b) => a - b));
      tell(`Page ${p} save ho gaya 🔖`);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/books/${bookId}/read`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      tell("Link copy ho gaya 📋");
    } catch {
      /* user ne cancel kiya */
    }
  };

  /* ---- Keyboard: ← → , Esc, Ctrl+F ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setTab("search");
        setIndexOn(true);
        setPanelOpen(true);
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (panelOpen) return;
      if (e.key === "ArrowRight") goTo(left + step, "next");
      if (e.key === "ArrowLeft") goTo(left - step, "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, left, step, panelOpen]);

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

  /* ---- Touch: swipe (book mode), do ungli se pinch-zoom ---- */
  const previewEl = () => (mode === "book" ? bookRef.current : mode === "scroll" ? scrollElRef.current : null);
  const onTouchStart = (e: RTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const st = stageRef.current;
      if (!st) return;
      const r = st.getBoundingClientRect();
      const a = e.touches[0];
      const b = e.touches[1];
      pinch.current = {
        d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1,
        z0: zoom,
        cx: (a.clientX + b.clientX) / 2 - r.left,
        cy: (a.clientY + b.clientY) / 2 - r.top,
        k: 1,
      };
      touch.current = null;
      return;
    }
    if (mode !== "book") return;
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: RTouchEvent<HTMLDivElement>) => {
    const p = pinch.current;
    if (!p || e.touches.length < 2) return;
    const a = e.touches[0];
    const b = e.touches[1];
    const z = Math.min(MAX_ZOOM, Math.max(1, p.z0 * (Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / p.d0)));
    p.k = z / p.z0;
    const el = previewEl();
    const st = stageRef.current;
    if (el && st) {
      el.style.transformOrigin = `${p.cx + st.scrollLeft - el.offsetLeft}px ${p.cy + st.scrollTop - el.offsetTop}px`;
      el.style.transform = `scale(${p.k})`;
    }
  };
  const onTouchEnd = (e: RTouchEvent<HTMLDivElement>) => {
    const p = pinch.current;
    if (p) {
      if (e.touches.length < 2) {
        pinch.current = null;
        suppressUntil.current = Date.now() + 450; // pinch ke baad bachi ungli ko tap na samjho
        if (Math.abs(p.k - 1) > 0.03) setZoomAt(p.z0 * p.k, p.cx, p.cy);
        else clearPreview();
      }
      return;
    }
    const s = touch.current;
    touch.current = null;
    if (mode !== "book" || !s || zoom > 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 60) goTo(dx < 0 ? left + step : left - step, dx < 0 ? "next" : "prev");
  };

  /* ---- Tap: kinara = page palto, beech = toolbar dikhao/chhupao, beech me do baar = zoom ---- */
  const onStageClick = (e: RMouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressUntil.current) return;
    if (window.getSelection()?.toString()) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (mode === "book" && zoom <= 1) {
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
    const now = Date.now();
    const lt = lastTap.current;
    if (now - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 40) {
      lastTap.current = { t: 0, x: 0, y: 0, chrome };
      setChrome(lt.chrome); // pehle tap se toolbar ka jo badlav hua tha use wapas karo
      setZoomAt(zoom > 1.05 ? 1 : DOUBLE_TAP_ZOOM, e.clientX - r.left, e.clientY - r.top);
      return;
    }
    lastTap.current = { t: now, x: e.clientX, y: e.clientY, chrome };
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
  // Toolbar ko ungli lagi: auto-hide ki ghadi dobara shuru
  const poke = () => setTick((t) => t + 1);

  const nums = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);

  /* Kisi page par: search ka peela nishaan + bookmark ka ribbon */
  const extras = (n: number) => (
    <>
      {hl && hl.page === n && (
        <div className="pdfr-marks" aria-hidden="true">
          {hl.marks.map((m, i) => (
            <i key={i} style={{ left: `${m.l}%`, top: `${m.t}%`, width: `${m.w}%`, height: `${m.h}%` }} />
          ))}
        </div>
      )}
      {saved.includes(n) && <span className="pdfr-ribbon" aria-hidden="true" />}
    </>
  );

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
  const sliderMax = Math.max(1, total);
  const sliderVal = Math.min(Math.max(Number(jump) || left, 1), sliderMax);
  const sliderPct = sliderMax > 1 ? ((sliderVal - 1) / (sliderMax - 1)) * 100 : 0;

  return (
    <div ref={wrapRef} className={`pdfr${chrome ? "" : " chrome-off"}`} data-theme={theme} data-full={full || undefined} role="region" aria-label={title}>
      <div className="pdfr-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="pdfr-bar" onPointerDown={poke} onPointerUp={poke}>
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
        <div className="pdfr-group pdfr-only-desk">
          <button type="button" className="pdfr-btn" onClick={() => setZoomAt(zoom - 0.25)} disabled={zoom <= 1} aria-label="Zoom kam karo">
            −
          </button>
          <span className="pdfr-zoom">{Math.round(zoom * 100)}%</span>
          <button type="button" className="pdfr-btn" onClick={() => setZoomAt(zoom + 0.25)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom badhao">
            +
          </button>
        </div>
        <div className="pdfr-group pdfr-only-desk">
          <button type="button" className="pdfr-btn pdfr-btn-text" onClick={cycleTheme} aria-label="Reading mode badlo">
            <IcTheme />
            <span>{THEME_LABEL[theme]}</span>
          </button>
        </div>
        <div className="pdfr-group">
          <button type="button" className="pdfr-btn" onClick={() => openPanel("search")} disabled={!pdf} aria-label="Book me search karo">
            <IcSearch />
          </button>
          <button type="button" className={`pdfr-btn${isSaved ? " is-on" : ""}`} onClick={toggleSaved} disabled={!pdf} aria-pressed={isSaved} aria-label={isSaved ? "Bookmark hatao" : "Is page ko bookmark karo"}>
            <IcBookmark on={isSaved} />
          </button>
          <button type="button" className="pdfr-btn" onClick={() => openPanel(tab)} disabled={!pdf} aria-label="Menu kholo">
            <IcMenu />
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
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!pdf && (
          <div className="pdfr-loading" role="status">
            <div className="pdfr-ring" aria-hidden="true" />
            <p className="pdfr-load-title">{title}</p>
            <p className="pdfr-load-sub">Book khul rahi hai{loadPct > 0 ? ` • ${loadPct}%` : "…"}</p>
            {loadPct > 0 && (
              <div className="pdfr-load-bar" aria-hidden="true">
                <span style={{ width: `${loadPct}%` }} />
              </div>
            )}
          </div>
        )}

        {pdf && rend && mode === "book" && (
          <div ref={bookRef} className={`pdfr-pages${spread ? " is-spread" : ""}`}>
            <div className={`pdfr-leaf${spread ? " is-left" : ""}`}>
              <PageCanvas rend={rend} num={left} width={pageW} onSize={onSize} />
              {extras(left)}
            </div>
            {right && (
              <div className="pdfr-leaf is-right">
                <PageCanvas rend={rend} num={right} width={pageW} onSize={onSize} />
                {extras(right)}
              </div>
            )}
          </div>
        )}

        {pdf && rend && mode === "scroll" && (
          <div ref={scrollElRef} className="pdfr-scroll" style={{ width: pageW, padding: `${PAD}px 0` }}>
            {nums.map((n) => (
              <div key={n} className="pdfr-leaf" style={{ width: pageW, height: heightOf(n), marginBottom: n === total ? 0 : GAP }}>
                {Math.abs(n - page) <= 2 && <PageCanvas rend={rend} num={n} width={pageW} onSize={onSize} />}
                {extras(n)}
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
                    {extras(n)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roshni kam karne ki parat */}
      <div className="pdfr-dim" style={{ opacity: dim / 100 }} aria-hidden="true" />

      {note && (
        <div key={note.id} className="pdfr-toast" role="status">
          {note.msg}
        </div>
      )}

      {/* Toolbar chhupi ho to bhi page number ek chhote pill me dikhe */}
      {pdf && (
        <div className="pdfr-pill" aria-hidden="true">
          {right ? `${left}–${right}` : left} / {total || "–"}
        </div>
      )}

      <div className="pdfr-nav" onPointerDown={poke} onPointerUp={poke}>
        <input
          className="pdfr-scrub"
          type="range"
          min={1}
          max={sliderMax}
          value={sliderVal}
          style={{ ["--p" as string]: `${sliderPct}%` } as CSSProperties}
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
          <span>
            / {total || "–"}
            {total > 0 && <em className="pdfr-pct">{Math.round(progress)}%</em>}
          </span>
        </label>
        <button type="button" className="pdfr-btn" onClick={() => goTo(left + step, "next")} disabled={atEnd} aria-label="Agla page">
          ›
        </button>
      </div>

      <PdfPanel
        open={panelOpen}
        tab={tab}
        onTab={changeTab}
        onClose={closePanel}
        total={total}
        current={left}
        thumbRend={thumbRend}
        query={query}
        onQuery={setQuery}
        hits={hits}
        indexPct={index.progress}
        indexDone={index.done}
        hasText={index.hasText}
        onPickHit={pickHit}
        toc={toc}
        onPickToc={pickToc}
        saved={saved}
        isSaved={isSaved}
        onToggleSaved={toggleSaved}
        onGo={pickPage}
        onRemoveSaved={(p) => writeSaved(saved.filter((x) => x !== p))}
        theme={theme}
        onTheme={setTheme}
        dim={dim}
        onDim={changeDim}
        zoom={zoom}
        onZoom={(z) => setZoomAt(z)}
        downloadHref={`/books/${bookId}/open?dl=1`}
        openHref={`/books/${bookId}/open`}
        onShare={() => void share()}
      />
    </div>
  );
}

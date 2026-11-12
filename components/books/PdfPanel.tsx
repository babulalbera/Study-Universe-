"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PageCanvas } from "./pdf-render";
import {
  IcBookmark, IcClose, IcDownload, IcExternal, IcGrid, IcSearch, IcShare, IcSliders, IcSun, IcToc,
  THEMES, THEME_LABEL, MAX_ZOOM,
  type Hit, type Renderer, type Tab, type Theme, type TocRow,
} from "./pdf-shared";

type Props = {
  open: boolean;
  tab: Tab;
  onTab: (t: Tab) => void;
  onClose: () => void;
  total: number;
  current: number;
  thumbRend: Renderer | null;
  // Search
  query: string;
  onQuery: (q: string) => void;
  hits: Hit[];
  indexPct: number;
  indexDone: boolean;
  hasText: boolean;
  onPickHit: (h: Hit) => void;
  // Contents
  toc: TocRow[];
  onPickToc: (r: TocRow) => void;
  // Saved (bookmarks)
  saved: number[];
  isSaved: boolean;
  onToggleSaved: () => void;
  onGo: (p: number) => void;
  onRemoveSaved: (p: number) => void;
  // Settings
  theme: Theme;
  onTheme: (t: Theme) => void;
  dim: number;
  onDim: (n: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  downloadHref: string;
  openHref: string;
  onShare: () => void;
};

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "search", label: "Search", icon: <IcSearch /> },
  { id: "toc", label: "Index", icon: <IcToc /> },
  { id: "pages", label: "Pages", icon: <IcGrid /> },
  { id: "saved", label: "Saved", icon: <IcBookmark /> },
  { id: "settings", label: "Settings", icon: <IcSliders /> },
];

/* ---- Pages tab: chhota thumbnail, jab screen par aaye tabhi banta hai ---- */
function Thumb({ rend, num, on, saved, onPick }: { rend: Renderer | null; num: number; on: boolean; saved: boolean; onPick: (n: number) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <button ref={ref} type="button" className={`pdfr-th${on ? " on" : ""}`} onClick={() => onPick(num)} aria-label={`Page ${num}`}>
      <span className="pdfr-th-box">
        {seen && rend && <PageCanvas rend={rend} num={num} width={120} />}
        {saved && <i className="pdfr-th-bm" aria-hidden="true" />}
      </span>
      <span>{num}</span>
    </button>
  );
}

function PagesTab({ p }: { p: Props }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const nums = Array.from({ length: p.total }, (_, i) => i + 1);

  // Khulte hi abhi wale page ke paas le jao
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const grid = gridRef.current;
      const body = grid?.parentElement;
      const el = grid?.querySelector<HTMLElement>(".pdfr-th.on");
      if (!body || !el) return;
      const b = body.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      body.scrollTop += r.top - b.top - b.height / 2 + r.height / 2;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={gridRef} className="pdfr-thumbs">
      {nums.map((n) => (
        <Thumb key={n} rend={p.thumbRend} num={n} on={n === p.current} saved={p.saved.includes(n)} onPick={p.onGo} />
      ))}
    </div>
  );
}

function SearchTab({ p }: { p: Props }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const short = p.query.trim().length < 2;
  let status: string;
  if (!p.indexDone && !p.hasText) status = "";
  else if (p.indexDone && !p.hasText) status = "Is book me search karne layak text nahi mila (shayad photo/scanned PDF hai).";
  else if (short) status = !p.indexDone ? `Book ka text taiyaar ho raha hai… ${p.indexPct}%` : "Kam se kam 2 akshar likho.";
  else if (p.hits.length === 0) status = p.indexDone ? "Kuch nahi mila. Doosra shabd try karo." : `Dhundh rahe hain… ${p.indexPct}%`;
  else status = `${p.hits.length}${p.hits.length >= 300 ? "+" : ""} result mile${p.indexDone ? "" : ` (abhi ${p.indexPct}% book dekhi)`}`;

  return (
    <div className="pdfr-search">
      <label className="pdfr-sbox">
        <IcSearch />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Book me dhundo…"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          aria-label="Book me search"
        />
        {p.query && (
          <button type="button" onClick={() => p.onQuery("")} aria-label="Saaf karo">
            <IcClose />
          </button>
        )}
      </label>
      {status && <p className="pdfr-hint">{status}</p>}
      {!p.indexDone && p.hasText && <div className="pdfr-load-bar" aria-hidden="true"><span style={{ width: `${p.indexPct}%` }} /></div>}
      <div className="pdfr-hits">
        {p.hits.map((h, i) => (
          <button key={`${h.page}-${i}`} type="button" className="pdfr-hit" onClick={() => p.onPickHit(h)}>
            <b>p.{h.page}</b>
            <span>
              {h.before}
              <mark>{h.match}</mark>
              {h.after}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TocTab({ p }: { p: Props }) {
  if (p.toc.length === 0) {
    return <p className="pdfr-empty">Is book me Index (Contents) nahi hai. Search ya Pages tab use karo.</p>;
  }
  return (
    <div className="pdfr-toc">
      {p.toc.map((r, i) => (
        <button key={i} type="button" className="pdfr-toc-row" style={{ paddingLeft: 10 + Math.min(r.depth, 4) * 14 }} onClick={() => p.onPickToc(r)}>
          <span className="pdfr-toc-t">{r.title}</span>
          {r.page && <em>{r.page}</em>}
        </button>
      ))}
    </div>
  );
}

function SavedTab({ p }: { p: Props }) {
  return (
    <div className="pdfr-saved">
      <button type="button" className={`pdfr-act pdfr-act-main${p.isSaved ? " on" : ""}`} onClick={p.onToggleSaved}>
        <IcBookmark on={p.isSaved} />
        {p.isSaved ? `Page ${p.current} saved hai (hatao)` : `Page ${p.current} save karo`}
      </button>
      {p.saved.length === 0 ? (
        <p className="pdfr-empty">Abhi koi bookmark nahi. Zaroori page yahan save kar lo, baad me ek tap me wapas aa jao.</p>
      ) : (
        <ul className="pdfr-bm-list">
          {p.saved.map((n) => (
            <li key={n}>
              <button type="button" className="pdfr-bm-go" onClick={() => p.onGo(n)}>
                <IcBookmark on />
                <span>Page {n}</span>
                <em>{p.total ? Math.round((n / p.total) * 100) : 0}%</em>
              </button>
              <button type="button" className="pdfr-bm-x" onClick={() => p.onRemoveSaved(n)} aria-label={`Page ${n} ka bookmark hatao`}>
                <IcClose />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="pdfr-hint">Bookmarks isi phone/browser me save hote hain.</p>
    </div>
  );
}

function SettingsTab({ p }: { p: Props }) {
  return (
    <div className="pdfr-settings">
      <section>
        <h4>Reading mode</h4>
        <div className="pdfr-chips">
          {THEMES.map((t) => (
            <button key={t} type="button" className={`pdfr-chip${p.theme === t ? " on" : ""}`} onClick={() => p.onTheme(t)}>
              {THEME_LABEL[t]}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h4><IcSun /> Roshni kam karo <em>{p.dim}%</em></h4>
        <input className="pdfr-scrub" type="range" min={0} max={60} step={5} value={p.dim} onChange={(e) => p.onDim(Number(e.target.value))} style={{ ["--p" as string]: `${(p.dim / 60) * 100}%` } as CSSProperties} aria-label="Roshni kam karo" />
      </section>
      <section>
        <h4>Zoom <em>{Math.round(p.zoom * 100)}%</em></h4>
        <div className="pdfr-chips">
          <button type="button" className="pdfr-chip" onClick={() => p.onZoom(p.zoom - 0.25)} disabled={p.zoom <= 1}>−</button>
          <button type="button" className="pdfr-chip" onClick={() => p.onZoom(1)} disabled={p.zoom === 1}>Reset</button>
          <button type="button" className="pdfr-chip" onClick={() => p.onZoom(p.zoom + 0.25)} disabled={p.zoom >= MAX_ZOOM}>+</button>
        </div>
        <p className="pdfr-hint">Tip: page par do baar tap karo ya do ungli se pinch karo.</p>
      </section>
      <section className="pdfr-actions">
        <a className="pdfr-act" href={p.downloadHref}><IcDownload /> Download</a>
        <a className="pdfr-act" href={p.openHref} target="_blank" rel="noopener noreferrer"><IcExternal /> Naye Tab me</a>
        <button type="button" className="pdfr-act" onClick={p.onShare}><IcShare /> Share</button>
      </section>
    </div>
  );
}

export default function PdfPanel(p: Props) {
  return (
    <div className={`pdfr-sheet${p.open ? " open" : ""}`} aria-hidden={!p.open}>
      <div className="pdfr-sheet-bg" onClick={p.onClose} />
      <div className="pdfr-sheet-panel" role="dialog" aria-modal="true" aria-label="Book menu">
        <div className="pdfr-sheet-handle" aria-hidden="true" />
        <button type="button" className="pdfr-sheet-x" onClick={p.onClose} aria-label="Band karo">
          <IcClose />
        </button>
        <div className="pdfr-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={p.tab === t.id} className={`pdfr-tab${p.tab === t.id ? " on" : ""}`} onClick={() => p.onTab(t.id)}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {p.open && (
          <div className="pdfr-sheet-body" key={p.tab}>
            {p.tab === "search" && <SearchTab p={p} />}
            {p.tab === "toc" && <TocTab p={p} />}
            {p.tab === "pages" && <PagesTab p={p} />}
            {p.tab === "saved" && <SavedTab p={p} />}
            {p.tab === "settings" && <SettingsTab p={p} />}
          </div>
        )}
      </div>
    </div>
  );
}

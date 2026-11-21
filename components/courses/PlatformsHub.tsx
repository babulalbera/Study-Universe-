"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Platform } from "@/features/platforms/data";
import { useToast } from "@/components/ui/Toast";
import "./platforms-hub.css";

const KEY_PINS = "su-ph-pins";
const KEY_REC = "su-ph-rec";
const ICON: Record<string, string> = { books: "📚", "test-series": "📝", "all-in-one-hubs": "🧭", tools: "🛠️", others: "✨", "coding---python": "💻", cbse: "🏫", cds: "🎖️", kota: "🚀", pinnacle: "🏔️" };
const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
const glow = (p: Platform) => (p.color === "#111113" ? "var(--gold)" : p.color);
const tint = (p: Platform) => (p.color === "#111113" ? "#3b4272" : p.color);
const initials = (n: string) => {
  const w = n.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || "?").slice(0, 2)).toUpperCase();
};
const load = (k: string): string[] => {
  try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};
const save = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

/* Logo: neeche hamesha rangin badge (initials/icon) rehta hai, upar asli logo load hote hi aa jata hai.
   Isliye koi tile kabhi khaali ya toota hua nahi dikhta. */
function Logo({ p, size }: { p: Platform; size: number }) {
  const [ok, setOk] = useState(false);
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) setOk(true); // hydrate se pehle hi load ho chuka ho to
  }, []);
  const icon = ICON[p.id];
  return (
    <span className="ph-tile" style={{ width: size, height: size, fontSize: size * (icon ? 0.46 : 0.36), "--t": tint(p) } as CSSProperties}>
      <i>{icon ?? initials(p.name)}</i>
      {p.logo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={ref} src={p.logo} alt={`${p.name} logo`} decoding="async" referrerPolicy="no-referrer" className={ok ? "on" : ""} onLoad={() => setOk(true)} />
        </>
      ) : null}
    </span>
  );
}

function Count({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1300);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

type Filter = "all" | "top" | "pin";

export default function PlatformsHub({ platforms }: { platforms: Platform[] }) {
  const toast = useToast();
  const root = useRef<HTMLElement>(null);
  const [q, setQ] = useState("");
  const [lq, setLq] = useState("");
  const [f, setF] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pins, setPins] = useState<string[]>([]);
  const [rec, setRec] = useState<string[]>([]);

  useEffect(() => {
    setPins(load(KEY_PINS));
    setRec(load(KEY_REC));
    const sync = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setOpenId(platforms.some((p) => p.id === id) ? id : null);
      setLq("");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [platforms]);

  useEffect(() => {
    if (openId) root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openId]);

  const total = useMemo(() => platforms.reduce((s, p) => s + p.links.length, 0), [platforms]);
  const index = useMemo(
    () => platforms.flatMap((p) => p.links.map((l) => ({ p, l, s: `${l.title} ${host(l.url)}`.toLowerCase() }))),
    [platforms],
  );
  const reversed = useMemo(() => [...platforms].reverse(), [platforms]);
  const cur = platforms.find((p) => p.id === openId) ?? null;
  const ql = q.trim().toLowerCase();
  const cards = platforms.filter((p) => (!ql || `${p.name} ${p.desc}`.toLowerCase().includes(ql)) && (f === "all" || (f === "top" ? p.links.length >= 10 : pins.includes(p.id))));
  const hits = ql.length > 1 ? index.filter((x) => x.s.includes(ql)).slice(0, 6) : [];
  const shelf = Array.from(new Set([...pins, ...rec]))
    .slice(0, 8)
    .map((id) => platforms.find((p) => p.id === id))
    .filter((p): p is Platform => !!p);

  const open = (id: string) => {
    const next = [id, ...rec.filter((x) => x !== id)].slice(0, 6);
    setRec(next);
    save(KEY_REC, next);
    window.location.hash = id;
  };
  const close = () => {
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    setOpenId(null);
  };
  const togglePin = (id: string) => {
    const on = pins.includes(id);
    const next = on ? pins.filter((x) => x !== id) : [id, ...pins];
    setPins(next);
    save(KEY_PINS, next);
    toast(on ? "Pin hata diya" : "Shelf me pin ho gaya ★");
  };
  const copy = async (text: string, msg = "Link copy ho gaya ✅") => {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast("Copy nahi hua, link kholkar copy karo"); }
  };
  const share = async () => {
    if (!cur) return;
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: `${cur.name} ki saari links`, url }); } catch { /* cancelled */ } } else { copy(url); }
  };
  const spot = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = e.currentTarget.style;
    s.setProperty("--x", `${e.clientX - r.left}px`);
    s.setProperty("--y", `${e.clientY - r.top}px`);
    s.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -7}deg`);
    s.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 7}deg`);
  };
  const unspot = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  /* ---------- Platform ke andar ---------- */
  if (cur) {
    const lql = lq.trim().toLowerCase();
    const rows = cur.links.filter((l) => !lql || `${l.title} ${host(l.url)}`.toLowerCase().includes(lql));
    return (
      <section ref={root} className="ph ph-detail" style={{ "--c": glow(cur) } as CSSProperties} aria-label={`${cur.name} links`}>
        <div className="ph-bar">
          <button type="button" className="ph-btn" onClick={close}>← Sab Platforms</button>
          <span>
            <button type="button" className="ph-btn" onClick={() => copy(cur.links.map((l) => `${l.title}\n${l.url}`).join("\n\n"), "Saari links copy ho gayi ✅")}>Sab copy</button>
            <button type="button" className="ph-btn" onClick={share}>Share</button>
          </span>
        </div>
        <div className="ph-dh">
          <Logo p={cur} size={88} />
          <div>
            <h2 className="ph-title">{cur.name}</h2>
            <p className="ph-sub">{cur.desc}</p>
            <div className="ph-tags"><span>{cur.links.length} links</span><span>Free, No Login</span></div>
          </div>
        </div>
        <div className="ph-search ph-sticky">
          <input value={lq} onChange={(e) => setLq(e.target.value)} placeholder="Is platform me search karo..." aria-label="Links search" />
        </div>
        {rows.length === 0 ? (
          <p className="ph-empty">Is platform me kuch nahi mila.</p>
        ) : (
          <ul className="ph-list">
            {rows.map((l, i) => (
              <li key={l.url + i} className="ph-row" style={{ "--i": Math.min(i, 10) } as CSSProperties}>
                <span className="ph-n">{i + 1}</span>
                <a className="ph-rm" href={l.url} target="_blank" rel="noopener noreferrer">
                  <b>{l.title}</b>
                  <small>{host(l.url)}</small>
                </a>
                <button type="button" className="ph-cp" onClick={() => copy(l.url)} aria-label="Link copy karo">⧉</button>
                <a className="ph-go" href={l.url} target="_blank" rel="noopener noreferrer">Open</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const reel = (list: Platform[], rev: boolean) => (
    <div className={`ph-reel${rev ? " rev" : ""}`}>
      <div>
        {[0, 1].map((k) =>
          list.map((p) => (
            <button key={`${k}-${p.id}`} type="button" onClick={() => open(p.id)} aria-label={p.name} aria-hidden={k === 1} tabIndex={k === 1 ? -1 : 0}>
              <Logo p={p} size={54} />
            </button>
          )),
        )}
      </div>
    </div>
  );

  /* ---------- Home ---------- */
  return (
    <section ref={root} className="ph" aria-label="Free Course Platforms">
      <div className="ph-hero">
        <div className="ph-hero-in">
          <h2 className="ph-title">Free Course Platforms</h2>
          <p className="ph-sub">Logo dabao, us platform ki saari links khul jayengi. Sab free, bina kisi fees ke.</p>
          <div className="ph-stats">
            <div><b><Count to={platforms.length} /></b><small>Platforms</small></div>
            <div><b><Count to={total} />+</b><small>Links</small></div>
            <div><b>100%</b><small>Free</small></div>
          </div>
        </div>
      </div>

      <div className="ph-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Platform ya link search karo..." aria-label="Platform search" />
        {q && <button type="button" className="ph-x" onClick={() => setQ("")} aria-label="Search saaf karo">✕</button>}
      </div>

      <div className="ph-chips">
        {([["all", "Sab"], ["top", "Zyada links (10+)"], ["pin", "Pinned"]] as [Filter, string][]).map(([k, label]) => (
          <button key={k} type="button" className={`ph-chip${f === k ? " on" : ""}`} onClick={() => setF(k)}>{label}</button>
        ))}
      </div>

      {hits.length > 0 && (
        <div className="ph-hits">
          <h4>Ye links bhi mili</h4>
          {hits.map((x, i) => (
            <a key={x.l.url + i} className="ph-hit" href={x.l.url} target="_blank" rel="noopener noreferrer">
              <Logo p={x.p} size={36} />
              <span><b>{x.l.title}</b><small>{x.p.name} - {host(x.l.url)}</small></span>
            </a>
          ))}
        </div>
      )}

      {reel(platforms, false)}
      {reel(reversed, true)}

      {shelf.length > 0 && (
        <>
          <h3 className="ph-h3">Aapka Apna Shelf</h3>
          <div className="ph-mine">
            {shelf.map((p) => (
              <button key={p.id} type="button" className="ph-mini" onClick={() => open(p.id)}>
                <Logo p={p} size={42} />
                <span><b>{p.name}</b><small>{pins.includes(p.id) ? "Pinned" : "Recent"}</small></span>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="ph-h3">Saare Platforms</h3>
      <div className="ph-grid">
        {cards.map((p, i) => (
          <article key={p.id} className={`ph-card${pins.includes(p.id) ? " pinned" : ""}`} style={{ "--c": glow(p), "--i": Math.min(i, 12) } as CSSProperties} onPointerMove={spot} onPointerLeave={unspot}>
            <span className="ph-orb" aria-hidden="true" />
            <button type="button" className="ph-main" onClick={() => open(p.id)}>
              <Logo p={p} size={68} />
              <strong>{p.name}</strong>
              <span className="ph-d">{p.desc}</span>
              <span className="ph-cta">Explore <em>→</em></span>
            </button>
            <span className="ph-badge">{p.links.length} links</span>
            <button type="button" className={`ph-pin${pins.includes(p.id) ? " on" : ""}`} onClick={() => togglePin(p.id)} aria-label={`${p.name} pin karo`} aria-pressed={pins.includes(p.id)}>
              {pins.includes(p.id) ? "★" : "☆"}
            </button>
          </article>
        ))}
      </div>
      {cards.length === 0 && hits.length === 0 && <p className="ph-empty">Kuch nahi mila. Filter ya search badal ke dekho.</p>}
    </section>
  );
}

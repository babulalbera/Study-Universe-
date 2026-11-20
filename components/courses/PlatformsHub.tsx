"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { PLATFORMS, type Platform } from "@/features/platforms/data";
import { useToast } from "@/components/ui/Toast";
import "./platforms-hub.css";

const KEY_PINS = "su-ph-pins";
const KEY_REC = "su-ph-rec";
const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
const hasRealLogo = (p: Platform) => !!p.logo && !p.logo.includes("s2/favicons");
const glow = (p: Platform) => (p.color === "#111113" ? "var(--gold)" : p.color);
const load = (k: string): string[] => {
  try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};
const save = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

function Logo({ p, size }: { p: Platform; size: number }) {
  const [bad, setBad] = useState(false);
  const real = hasRealLogo(p) && !bad;
  return (
    <span className={`ph-tile${real ? " is-real" : ""}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={real ? p.logo : `/platform-logos/${p.id}.png`} alt={`${p.name} logo`} width={160} height={160} loading="lazy" onError={() => setBad(true)} />
    </span>
  );
}

export default function PlatformsHub() {
  const toast = useToast();
  const root = useRef<HTMLElement>(null);
  const [q, setQ] = useState("");
  const [lq, setLq] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pins, setPins] = useState<string[]>([]);
  const [rec, setRec] = useState<string[]>([]);

  // Saved shelf + URL hash (#pw) <-> open platform. Hash se back button aur share link dono chalte hain.
  useEffect(() => {
    setPins(load(KEY_PINS));
    setRec(load(KEY_REC));
    const sync = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setOpenId(PLATFORMS.some((p) => p.id === id) ? id : null);
      setLq("");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (openId) root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openId]);

  const total = useMemo(() => PLATFORMS.reduce((s, p) => s + p.links.length, 0), []);
  const index = useMemo(
    () => PLATFORMS.flatMap((p) => p.links.map((l) => ({ p, l, s: `${l.title} ${host(l.url)}`.toLowerCase() }))),
    [],
  );
  const cur = PLATFORMS.find((p) => p.id === openId) ?? null;
  const ql = q.trim().toLowerCase();
  const cards = PLATFORMS.filter((p) => !ql || `${p.name} ${p.desc}`.toLowerCase().includes(ql));
  const hits = ql.length > 1 ? index.filter((x) => x.s.includes(ql)).slice(0, 6) : [];
  const shelf = Array.from(new Set([...pins, ...rec]))
    .slice(0, 8)
    .map((id) => PLATFORMS.find((p) => p.id === id))
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
  const copy = async (u: string) => {
    try { await navigator.clipboard.writeText(u); toast("Link copy ho gaya ✅"); } catch { toast("Copy nahi hua, link kholkar copy karo"); }
  };
  const share = async () => {
    if (!cur) return;
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: `${cur.name} ki saari links`, url }); } catch { /* cancelled */ } } else { copy(url); }
  };
  const spot = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  /* ---------- Platform ke andar ---------- */
  if (cur) {
    const lql = lq.trim().toLowerCase();
    const rows = cur.links.filter((l) => !lql || `${l.title} ${host(l.url)}`.toLowerCase().includes(lql));
    return (
      <section ref={root} className="ph ph-detail" style={{ "--c": glow(cur) } as CSSProperties} aria-label={`${cur.name} links`}>
        <div className="ph-bar">
          <button type="button" className="ph-btn" onClick={close}>← Sab Platforms</button>
          <button type="button" className="ph-btn" onClick={share}>Share</button>
        </div>
        <div className="ph-dh">
          <Logo p={cur} size={84} />
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

  /* ---------- Home: search, logo reel, cards ---------- */
  return (
    <section ref={root} className="ph" aria-label="Free Course Platforms">
      <div className="ph-head">
        <h2 className="ph-title">Free Course Platforms</h2>
        <p className="ph-sub">{PLATFORMS.length} platforms aur {total} links. Logo dabao, saari links khul jayengi.</p>
      </div>

      <div className="ph-search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Platform ya link search karo..." aria-label="Platform search" />
        {q && <button type="button" className="ph-x" onClick={() => setQ("")} aria-label="Search saaf karo">✕</button>}
      </div>

      {hits.length > 0 && (
        <div className="ph-hits">
          <h4>Ye links bhi mili</h4>
          {hits.map((x, i) => (
            <a key={x.l.url + i} className="ph-hit" href={x.l.url} target="_blank" rel="noopener noreferrer">
              <Logo p={x.p} size={34} />
              <span><b>{x.l.title}</b><small>{x.p.name} - {host(x.l.url)}</small></span>
            </a>
          ))}
        </div>
      )}

      <div className="ph-reel" aria-label="Saare platform logos">
        <div>
          {[0, 1].map((k) =>
            PLATFORMS.map((p) => (
              <button key={`${k}-${p.id}`} type="button" onClick={() => open(p.id)} aria-label={p.name} aria-hidden={k === 1} tabIndex={k === 1 ? -1 : 0}>
                <Logo p={p} size={56} />
              </button>
            )),
          )}
        </div>
      </div>

      {shelf.length > 0 && (
        <>
          <h3 className="ph-h3">Aapka Apna Shelf</h3>
          <div className="ph-mine">
            {shelf.map((p) => (
              <button key={p.id} type="button" className="ph-mini" onClick={() => open(p.id)}>
                <Logo p={p} size={40} />
                <span><b>{p.name}</b><small>{pins.includes(p.id) ? "Pinned" : "Recent"}</small></span>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="ph-h3">Saare Platforms</h3>
      <div className="ph-grid">
        {cards.map((p, i) => (
          <article key={p.id} className="ph-card" style={{ "--c": glow(p), "--i": Math.min(i, 10) } as CSSProperties} onPointerMove={spot}>
            <button type="button" className="ph-main" onClick={() => open(p.id)}>
              <Logo p={p} size={60} />
              <strong>{p.name}</strong>
              <span className="ph-d">{p.desc}</span>
              <span className="ph-cta">Explore →</span>
            </button>
            <span className="ph-badge">{p.links.length}</span>
            <button type="button" className={`ph-pin${pins.includes(p.id) ? " on" : ""}`} onClick={() => togglePin(p.id)} aria-label={`${p.name} pin karo`} aria-pressed={pins.includes(p.id)}>
              {pins.includes(p.id) ? "★" : "☆"}
            </button>
          </article>
        ))}
      </div>
      {cards.length === 0 && hits.length === 0 && <p className="ph-empty">Kuch nahi mila. PW, NT ya Books try karo.</p>}
    </section>
  );
}


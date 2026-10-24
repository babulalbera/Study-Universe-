"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { derive, isHex, VAR_KEYS, type Vars } from "@/lib/theme-colors";
import "./theme-panel.css";

type Theme = { key: string; label: string; a: string; b: string; vars?: Vars; custom?: boolean };
type Custom = { id: string; name: string; a: string; b: string };

// Pehle ke 4 rang bilkul waise hi (exact), naye rang do rang se bante hain
const BASE: Theme[] = [
  { key: "emerald", label: "Emerald Gold", a: "#D4AF37", b: "#10B981", vars: { "--gold": "#D4AF37", "--gold2": "#FFD700", "--gold3": "#FFE082", "--gold4": "#E8B84A", "--em": "#10B981", "--mint": "#a7f3d0", "--bg": "#020603", "--surf": "#0b1a10" } },
  { key: "sapphire", label: "Royal Sapphire", a: "#60A5FA", b: "#818CF8", vars: { "--gold": "#60A5FA", "--gold2": "#7DD3FC", "--gold3": "#BAE6FD", "--gold4": "#38BDF8", "--em": "#818CF8", "--mint": "#C7D2FE", "--bg": "#020512", "--surf": "#0a1330" } },
  { key: "ember", label: "Ember Saffron", a: "#FB923C", b: "#F43F5E", vars: { "--gold": "#FB923C", "--gold2": "#FDBA74", "--gold3": "#FED7AA", "--gold4": "#F97316", "--em": "#F43F5E", "--mint": "#FECDD3", "--bg": "#0a0303", "--surf": "#220c0c" } },
  { key: "amethyst", label: "Royal Amethyst", a: "#C084FC", b: "#EC4899", vars: { "--gold": "#C084FC", "--gold2": "#D8B4FE", "--gold3": "#E9D5FF", "--gold4": "#A855F7", "--em": "#EC4899", "--mint": "#FBCFE8", "--bg": "#060210", "--surf": "#170b2d" } },
  { key: "rose", label: "Rose Blush", a: "#F472B6", b: "#FB7185" },
  { key: "teal", label: "Ocean Teal", a: "#2DD4BF", b: "#06B6D4" },
  { key: "crimson", label: "Crimson Royal", a: "#EF4444", b: "#FACC15" },
  { key: "lime", label: "Lime Forest", a: "#A3E635", b: "#22C55E" },
  { key: "sunrise", label: "Golden Sunrise", a: "#FBBF24", b: "#F97316" },
  { key: "silver", label: "Midnight Silver", a: "#E2E8F0", b: "#94A3B8" },
  { key: "mocha", label: "Mocha Cream", a: "#D6A77A", b: "#A16207" },
  { key: "aqua", label: "Electric Aqua", a: "#22D3EE", b: "#3B82F6" },
];
const INTERVAL = 9000; // Auto mein har 9 second par naya rang
const MAX_CUSTOM = 8;

const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const load = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

function paint(vars: Vars, key: string, persist: boolean) {
  const root = document.documentElement;
  for (const k of VAR_KEYS) root.style.setProperty(k, vars[k]);
  root.dataset.theme = key;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", vars["--bg"]));
  if (persist) save("su-vars", JSON.stringify(vars));
}

function readCustoms(): Custom[] {
  try {
    const a = JSON.parse(load("su-custom") || "[]");
    return Array.isArray(a)
      ? a.filter((c): c is Custom => c && typeof c.id === "string" && typeof c.name === "string" && isHex(c.a) && isHex(c.b)).slice(0, MAX_CUSTOM)
      : [];
  } catch { return []; }
}

export default function ThemeDock() {
  const [theme, setTheme] = useState<string | null>(null); // null = abhi load ho raha hai (head ka script wala rang rehne do)
  const [auto, setAuto] = useState(false);
  const [open, setOpen] = useState(false);
  const [customs, setCustoms] = useState<Custom[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", a: "#E5B94E", b: "#22C55E" });
  const box = useRef<HTMLDivElement>(null);

  const all: Theme[] = [...BASE, ...customs.map((c) => ({ key: c.id, label: c.name, a: c.a, b: c.b, custom: true }))];
  const varsOf = (t: Theme): Vars => t.vars ?? derive(t.a, t.b);

  // Pichhla chuna hua rang + customs + Auto wapas laao
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = readCustoms();
    setCustoms(list);
    const t = load("su-theme");
    setTheme(t && (BASE.some((x) => x.key === t) || list.some((c) => c.id === t)) ? t : "emerald");
    const a = load("su-auto");
    setAuto(a === null ? !reduce : a === "1" && !reduce);
  }, []);

  // Rang lagao
  useEffect(() => {
    if (theme === null || creating) return;
    const t = all.find((x) => x.key === theme) ?? BASE[0];
    paint(varsOf(t), t.custom ? "custom" : t.key, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, customs, creating]);

  // Apni colour banate waqt live preview
  useEffect(() => {
    if (!creating || !isHex(draft.a) || !isHex(draft.b)) return;
    paint(derive(draft.a, draft.b), "custom", false);
  }, [creating, draft.a, draft.b]);

  // Auto: baari-baari se rang badlo (sirf pehle se bane rang)
  useEffect(() => {
    if (!auto || creating) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setTheme((cur) => BASE[(BASE.findIndex((x) => x.key === cur) + 1) % BASE.length].key);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [auto, creating]);

  // Bahar click ya Esc se band
  useEffect(() => {
    if (!open) return;
    const out = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) { setOpen(false); setCreating(false); } };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setCreating(false); } };
    document.addEventListener("pointerdown", out);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", esc); };
  }, [open]);

  function pick(k: string) { setAuto(false); setTheme(k); save("su-auto", "0"); save("su-theme", k); }
  function toggleAuto() { const n = !auto; setAuto(n); save("su-auto", n ? "1" : "0"); }

  function startCreate() {
    const cur = all.find((x) => x.key === theme) ?? BASE[0];
    setDraft({ name: "", a: cur.a, b: cur.b });
    setAuto(false); save("su-auto", "0");
    setCreating(true);
  }
  function saveCustom() {
    if (!isHex(draft.a) || !isHex(draft.b) || customs.length >= MAX_CUSTOM) return;
    const c: Custom = { id: `c-${Date.now().toString(36)}`, name: draft.name.trim().slice(0, 18) || `Meri colour ${customs.length + 1}`, a: draft.a.toUpperCase(), b: draft.b.toUpperCase() };
    const next = [...customs, c];
    setCustoms(next); save("su-custom", JSON.stringify(next));
    setCreating(false); setTheme(c.id); save("su-theme", c.id);
  }
  function removeCustom(id: string) {
    const next = customs.filter((c) => c.id !== id);
    setCustoms(next); save("su-custom", JSON.stringify(next));
    if (theme === id) { setTheme("emerald"); save("su-theme", "emerald"); }
  }

  const row = (t: Theme) => (
    <div key={t.key} className="tdp-item">
      <button type="button" className="tdp-row" aria-pressed={theme === t.key} onClick={() => pick(t.key)} title={t.label}
        style={{ "--a": t.a, "--b": t.b } as CSSProperties}>
        <i className="tdp-sw" />
        <span className="tdp-nm">{t.label}</span>
        <span className="tdp-ck" aria-hidden="true">✓</span>
      </button>
      {t.custom && <button type="button" className="tdp-del" aria-label={`${t.label} hatao`} onClick={() => removeCustom(t.key)}>✕</button>}
    </div>
  );

  const preview = isHex(draft.a) && isHex(draft.b) ? ({ "--a": draft.a, "--b": draft.b } as CSSProperties) : undefined;

  return (
    <div className={`td${open ? " open" : ""}`} ref={box} role="group" aria-label="Colour theme">
      <button type="button" className="td-fab" aria-label="Colour theme badlo" aria-expanded={open} onClick={() => { setOpen((o) => !o); if (open) setCreating(false); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-4-4-7-9-7z" />
          <circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" />
        </svg>
      </button>

      <div className="td-pop tdp" aria-hidden={!open}>
        <div className="tdp-hd">
          <b>Colour theme</b>
          <button type="button" className="td-auto" aria-pressed={auto} aria-label="Auto colour change" onClick={toggleAuto}>Auto</button>
        </div>

        <div className="tdp-grid">{BASE.map(row)}</div>

        {customs.length > 0 && (
          <>
            <div className="tdp-sub">Meri colours</div>
            <div className="tdp-grid">{customs.map(row)}</div>
          </>
        )}

        {creating ? (
          <div className="tdp-form">
            <div className="tdp-sub">Apni colour banao</div>
            <input className="tdp-name" value={draft.name} maxLength={18} placeholder="Colour ka naam (jaise Meri Gold)"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Colour ka naam" />
            <div className="tdp-pick">
              <label>
                <span>Main colour</span>
                <input type="color" value={isHex(draft.a) ? draft.a : "#E5B94E"} onChange={(e) => setDraft({ ...draft, a: e.target.value })} />
              </label>
              <label>
                <span>Dusra colour</span>
                <input type="color" value={isHex(draft.b) ? draft.b : "#22C55E"} onChange={(e) => setDraft({ ...draft, b: e.target.value })} />
              </label>
            </div>
            <div className="tdp-prev" style={preview} aria-hidden="true"><i /><span>Live preview: poori site isi rang me dikh rahi hai</span></div>
            <div className="tdp-btns">
              <button type="button" className="tdp-save" onClick={saveCustom}>Save karo</button>
              <button type="button" className="tdp-cancel" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        ) : customs.length < MAX_CUSTOM ? (
          <button type="button" className="tdp-new" onClick={startCreate}>＋ Apni colour banao</button>
        ) : (
          <p className="tdp-max">Zyada se zyada {MAX_CUSTOM} apni colours. Koi hatao to nayi bana sakte ho.</p>
        )}
      </div>
    </div>
  );
}

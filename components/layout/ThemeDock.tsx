"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const THEMES = [
  { key: "emerald", label: "Emerald Gold", a: "#D4AF37", b: "#10B981", bg: "#020603" },
  { key: "sapphire", label: "Royal Sapphire", a: "#60A5FA", b: "#818CF8", bg: "#020512" },
  { key: "ember", label: "Ember Saffron", a: "#FB923C", b: "#F43F5E", bg: "#0a0303" },
  { key: "amethyst", label: "Royal Amethyst", a: "#C084FC", b: "#EC4899", bg: "#060210" },
] as const;
const INTERVAL = 9000; // Auto mein har 9 second par naya rang

const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const load = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

export default function ThemeDock() {
  const [theme, setTheme] = useState<string>("emerald");
  const [auto, setAuto] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Pichhla chuna hua rang + Auto wapas laao
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = load("su-theme");
    if (t && THEMES.some((x) => x.key === t)) setTheme(t);
    const a = load("su-auto");
    setAuto(a === null ? !reduce : a === "1" && !reduce);
  }, []);

  // Rang lagao
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const bg = THEMES.find((x) => x.key === theme)?.bg;
    if (bg) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
  }, [theme]);

  // Auto: baari-baari se rang badlo
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setTheme((cur) => THEMES[(THEMES.findIndex((x) => x.key === cur) + 1) % THEMES.length].key);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [auto]);

  // Bahar click ya Esc se band
  useEffect(() => {
    if (!open) return;
    const out = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", out);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", esc); };
  }, [open]);

  function pick(k: string) { setAuto(false); setTheme(k); save("su-auto", "0"); save("su-theme", k); }
  function toggleAuto() { const n = !auto; setAuto(n); save("su-auto", n ? "1" : "0"); }

  return (
    <div className={`td${open ? " open" : ""}`} ref={box} role="group" aria-label="Colour theme">
      <button type="button" className="td-fab" aria-label="Colour theme badlo" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-4-4-7-9-7z" />
          <circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" />
        </svg>
      </button>
      <div className="td-pop" aria-hidden={!open}>
        {THEMES.map((t) => (
          <button key={t.key} type="button" className="td-sw" tabIndex={open ? 0 : -1} aria-label={`${t.label} theme`} title={t.label}
            aria-pressed={theme === t.key} onClick={() => pick(t.key)} style={{ "--a": t.a, "--b": t.b } as CSSProperties}>
            <i />
          </button>
        ))}
        <button type="button" className="td-auto" tabIndex={open ? 0 : -1} aria-pressed={auto} aria-label="Auto colour change" onClick={toggleAuto}>Auto</button>
      </div>
    </div>
  );
}

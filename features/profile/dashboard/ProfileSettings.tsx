"use client";

import { useEffect, useState } from "react";
import AccountSection from "./AccountSection";
import type { FullProfile } from "./queries";

export default function ProfileSettings({ p }: { p: FullProfile }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return <>
    <button type="button" aria-label="Settings kholen" title="Settings" onClick={() => setOpen(true)} style={{ position: "absolute", top: 16, right: 16, width: 42, height: 42, borderRadius: 14, border: "1px solid var(--pd-border, #e5e7eb)", background: "var(--pd-card, #fff)", color: "inherit", fontSize: 22, cursor: "pointer" }}>⚙</button>
    {open && <div onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.58)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "18px 12px", overflowY: "auto" }}>
      <div role="dialog" aria-modal="true" aria-label="Account settings" style={{ width: "min(100%, 620px)", position: "relative", margin: "auto 0", background: "var(--pd-card, #fff)", color: "inherit", borderRadius: 18, padding: "18px 14px", boxShadow: "0 20px 70px rgba(0,0,0,.25)" }}>
        <button type="button" onClick={() => setOpen(false)} aria-label="Settings band karein" style={{ float: "right", border: 0, borderRadius: 10, padding: "7px 11px", fontSize: 20, cursor: "pointer", background: "transparent", color: "inherit" }}>✕</button>
        <AccountSection p={p} />
      </div>
    </div>}
  </>;
}

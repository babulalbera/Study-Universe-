"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPlatformLogo } from "@/features/admin/platform-actions";
import { COVER_MAX_MB } from "@/lib/book-meta";
import { checkCover, removeCover, uploadCover } from "./cover-upload";

// Platform ka logo upload / badalna / hatana (browser se seedha Storage me)
export default function PlatformLogoEditor({ id, name, src, hasFile }: { id: string; name: string; src: string | null; hasFile: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const bad = checkCover(file);
    if (bad) return setMsg({ ok: false, text: bad });
    setBusy(true);
    setMsg(null);
    const up = await uploadCover(file);
    if (!up.path) {
      setBusy(false);
      return setMsg({ ok: false, text: up.error ?? "Upload nahi hua" });
    }
    const res = await setPlatformLogo(id, up.path);
    if (res.error) {
      await removeCover(up.path);
      setBusy(false);
      return setMsg({ ok: false, text: res.error });
    }
    setBusy(false);
    setMsg({ ok: true, text: "Logo badal gaya ✓" });
    router.refresh();
  }

  async function onRemove() {
    setBusy(true);
    setMsg(null);
    const res = await setPlatformLogo(id, null);
    setBusy(false);
    if (res.error) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Logo hat gaya ✓" });
    router.refresh();
  }

  return (
    <div className="su-row" style={{ gap: 12, alignItems: "center", marginBottom: 12 }}>
      <span style={{ width: 72, height: 72, flex: "none", borderRadius: 18, overflow: "hidden", background: "#f4f5fa", display: "grid", placeItems: "center" }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`${name} logo`} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
        ) : (
          <b style={{ color: "#334155", fontSize: 20 }}>{name.slice(0, 2).toUpperCase()}</b>
        )}
      </span>
      <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
        <label className="pbtn pbtn-gold" style={{ cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "हो रहा है…" : hasFile ? "🖼 Logo बदलो" : "🖼 Logo Upload करो"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} hidden />
        </label>
        {hasFile && <button type="button" className="su-btn su-btn-ghost" onClick={onRemove} disabled={busy}>Upload किया Logo हटाओ</button>}
        <small className="su-muted">JPG / PNG / WebP, अधिकतम {COVER_MAX_MB}MB. Upload किया logo, link वाले logo से पहले दिखता है।</small>
        {msg && <small role={msg.ok ? "status" : "alert"} style={{ color: msg.ok ? "var(--mint, #a7f3d0)" : "#fca5a5" }}>{msg.text}</small>}
      </div>
    </div>
  );
}

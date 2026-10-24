"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BookCover from "@/components/books/BookCover";
import { setBookCover } from "@/features/admin/content-actions";
import { COVER_MAX_MB } from "@/lib/book-meta";
import { checkCover, removeCover, uploadCover } from "./cover-upload";

// Purani Book ka cover badalna ya hatana
export default function BookCoverEditor({ id, title, coverPath }: { id: string; title: string; coverPath: string | null }) {
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
    const res = await setBookCover(id, up.path);
    if (res.error) {
      await removeCover(up.path);
      setBusy(false);
      return setMsg({ ok: false, text: res.error });
    }
    setBusy(false);
    setMsg({ ok: true, text: "Cover badal gaya ✓" });
    router.refresh();
  }

  async function onRemove() {
    setBusy(true);
    setMsg(null);
    const res = await setBookCover(id, null);
    setBusy(false);
    if (res.error) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Cover hat gaya ✓" });
    router.refresh();
  }

  return (
    <div className="su-row" style={{ gap: 12, alignItems: "center", marginBottom: 12 }}>
      <BookCover path={coverPath} title={title} width={72} />
      <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
        <label className="pbtn pbtn-gold" style={{ cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "हो रहा है…" : coverPath ? "🖼 Cover बदलो" : "🖼 Cover जोड़ो"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} hidden />
        </label>
        {coverPath && (
          <button type="button" className="su-btn su-btn-ghost" onClick={onRemove} disabled={busy}>Cover हटाओ</button>
        )}
        <small className="su-muted">JPG / PNG / WebP, अधिकतम {COVER_MAX_MB}MB</small>
        {msg && <small role={msg.ok ? "status" : "alert"} style={{ color: msg.ok ? "var(--mint, #a7f3d0)" : "#fca5a5" }}>{msg.text}</small>}
      </div>
    </div>
  );
}

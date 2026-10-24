"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createBook } from "@/features/admin/content-actions";
import { createBookFromLink } from "@/features/admin/book-link-actions";
import { parseBookLink, SOURCE_LABEL } from "@/lib/book-links";
import { COVER_MAX_MB, MEDIUMS, MEDIUM_LABEL } from "@/lib/book-meta";
import { checkCover, removeCover, uploadCover } from "./cover-upload";

const MAX_MB = 50;

export default function BookUpload({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "link">("link");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [linkText, setLinkText] = useState("");
  const detected = linkText ? parseBookLink(linkText) : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (k: string) => String(fd.get(k) ?? "");
    const base = { title: str("title"), author: str("author"), categoryId: str("category_id") };
    const meta = {
      description: str("description"), medium: str("medium"), publisher: str("publisher"),
      edition: str("edition"), exam: str("exam"), pages: str("pages"),
      year: str("published_year"), sizeMb: str("file_size_mb"),
    };
    const coverRaw = fd.get("cover");
    const cover = coverRaw instanceof File && coverRaw.size > 0 ? coverRaw : null;
    if (cover) {
      const bad = checkCover(cover);
      if (bad) return setMsg({ ok: false, text: bad });
    }

    if (mode === "link") {
      if (!parseBookLink(linkText)) return setMsg({ ok: false, text: "https:// वाला सही Link डालो (Drive, Mega, Dropbox आदि)" });
      setBusy(true);
      setMsg(null);
      const cv = cover ? await uploadCover(cover) : null;
      if (cv?.error) {
        setBusy(false);
        return setMsg({ ok: false, text: cv.error });
      }
      const res = await createBookFromLink({ ...base, url: linkText, meta: { ...meta, coverPath: cv?.path ?? "" } });
      if (res.error) {
        if (cv?.path) await removeCover(cv.path);
        setBusy(false);
        return setMsg({ ok: false, text: res.error });
      }
      setBusy(false);
      form.reset();
      setLinkText("");
      setMsg({ ok: true, text: "Book Link से जुड़ गई ✓" });
      return router.refresh();
    }

    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return setMsg({ ok: false, text: "PDF चुनो" });
    if (file.type !== "application/pdf") return setMsg({ ok: false, text: "सिर्फ़ PDF चलेगी" });
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `फ़ाइल ${MAX_MB}MB से छोटी हो` });

    // File size khali ho to PDF ka asli size apne aap bhar do
    if (!meta.sizeMb.trim()) meta.sizeMb = String(Math.round((file.size / (1024 * 1024)) * 10) / 10);
    setBusy(true);
    setMsg(null);
    const cv = cover ? await uploadCover(cover) : null;
    if (cv?.error) {
      setBusy(false);
      return setMsg({ ok: false, text: cv.error });
    }
    const path = `${crypto.randomUUID()}.pdf`;
    const supabase = createClient();
    const up = await supabase.storage.from("books").upload(path, file, { contentType: "application/pdf" });
    if (up.error) {
      if (cv?.path) await removeCover(cv.path);
      setBusy(false);
      return setMsg({ ok: false, text: `Upload नहीं हुआ: ${up.error.message}` });
    }
    const res = await createBook({ ...base, storagePath: path, meta: { ...meta, coverPath: cv?.path ?? "" } });
    if (res.error) {
      await supabase.storage.from("books").remove([path]); // adhoora upload saaf
      if (cv?.path) await removeCover(cv.path);
      setBusy(false);
      return setMsg({ ok: false, text: res.error });
    }
    form.reset();
    setBusy(false);
    setMsg({ ok: true, text: "PDF Upload हो गई ✓" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="su-chips">
        <button type="button" className={`su-chip ${mode === "link" ? "on" : ""}`} onClick={() => { setMode("link"); setMsg(null); }}>🔗 Link से जोड़ो</button>
        <button type="button" className={`su-chip ${mode === "file" ? "on" : ""}`} onClick={() => { setMode("file"); setMsg(null); }}>⬆️ PDF Upload</button>
      </div>
      <label className="su-field"><span>Title</span><input name="title" required /></label>
      <label className="su-field"><span>Author (ज़रूरी नहीं)</span><input name="author" /></label>
      <label className="su-field"><span>Description (ज़रूरी नहीं, अधिकतम 500 अक्षर)</span><textarea name="description" rows={3} maxLength={500} /></label>
      <label className="su-field"><span>Cover Image (ज़रूरी नहीं, JPG/PNG/WebP, अधिकतम {COVER_MAX_MB}MB)</span>
        <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" style={{ height: "auto", padding: 10 }} />
      </label>
      <label className="su-field"><span>Category</span>
        <select name="category_id" defaultValue="">
          <option value="">— कोई नहीं —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="su-field"><span>Medium</span>
        <select name="medium" defaultValue="">
          <option value="">— चुनो —</option>
          {MEDIUMS.map((m) => <option key={m} value={m}>{MEDIUM_LABEL[m]}</option>)}
        </select>
      </label>
      <label className="su-field"><span>Publisher (जैसे Arihant, Lucent)</span><input name="publisher" maxLength={80} /></label>
      <label className="su-field"><span>Edition (जैसे 2024, 5th Edition)</span><input name="edition" maxLength={40} /></label>
      <label className="su-field"><span>Exam (जैसे SSC CGL, Army GD)</span><input name="exam" maxLength={60} /></label>
      <label className="su-field"><span>Pages</span><input name="pages" type="number" inputMode="numeric" min={1} max={10000} /></label>
      <label className="su-field"><span>Year (जैसे 2023)</span><input name="published_year" type="number" inputMode="numeric" min={1900} max={2100} /></label>
      <label className="su-field"><span>File Size MB (PDF Upload में खाली छोड़ो तो अपने आप भर जाएगा)</span><input name="file_size_mb" type="number" inputMode="decimal" step="0.1" min={0.1} /></label>
      {mode === "link" ? (
        <label className="su-field">
          <span>Book का Link (Google Drive, Mega, Dropbox, OneDrive, MediaFire, Telegram…)</span>
          <input name="url" type="url" inputMode="url" placeholder="https://drive.google.com/file/d/…" value={linkText} onChange={(e) => setLinkText(e.target.value)} required />
          {detected && <small style={{ color: "var(--mint, #a7f3d0)" }}>✓ {SOURCE_LABEL[detected.source]} Link पहचाना गया</small>}
          <small className="su-muted">Drive में “Anyone with the link” सेट रखो, वरना Students नहीं खोल पाएँगे।</small>
        </label>
      ) : (
        <label className="su-field"><span>PDF फ़ाइल (अधिकतम {MAX_MB}MB)</span><input name="file" type="file" accept="application/pdf" required style={{ height: "auto", padding: 10 }} /></label>
      )}
      <button type="submit" className="pbtn pbtn-gold" disabled={busy}>{busy ? "हो रहा है…" : mode === "link" ? "🔗 Book जोड़ो" : "⬆️ Upload करो"}</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className="text-[13px]" style={{ color: msg.ok ? "var(--mint, #a7f3d0)" : "#fca5a5" }}>{msg.text}</p>}
    </form>
  );
}

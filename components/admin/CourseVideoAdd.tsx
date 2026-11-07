"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { removeCover, uploadCover } from "@/components/admin/cover-upload";
import { createVideoFromLink, createVideoFromUpload } from "@/features/admin/course-video-actions";
import { UPLOAD_MAX_MB, UPLOAD_TYPES, VIDEO_SOURCE_LABEL, parseVideoLink } from "@/lib/video-links";

const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/x-m4v": "m4v" };

export default function CourseVideoAdd({ courseId, folders }: { courseId: string; folders: { id: string; title: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"link" | "file">("link");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [linkText, setLinkText] = useState("");
  const detected = linkText ? parseVideoLink(linkText) : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (k: string) => String(fd.get(k) ?? "");
    const base = { courseId, folderId: str("folder_id"), title: str("title"), description: str("description") };
    setMsg(null);

    // Thumbnail (ज़रूरी नहीं). YouTube की अपनी Thumbnail अपने-आप दिखती है
    const thumbFile = fd.get("thumb");
    const hasThumb = thumbFile instanceof File && thumbFile.size > 0;

    if (mode === "link") {
      if (!parseVideoLink(linkText)) return setMsg({ ok: false, text: "सही Link डालो: YouTube, Google Drive, MEGA या सीधा .mp4 (https://...)" });
      setBusy(true);
      let thumbPath: string | undefined;
      if (hasThumb) {
        const t = await uploadCover(thumbFile);
        if (!t.path) { setBusy(false); return setMsg({ ok: false, text: t.error ?? "Thumbnail upload नहीं हुआ" }); }
        thumbPath = t.path;
      }
      const res = await createVideoFromLink({ ...base, url: linkText, thumbPath });
      setBusy(false);
      if (res.error) {
        if (thumbPath) await removeCover(thumbPath);
        return setMsg({ ok: false, text: res.error });
      }
      form.reset();
      setLinkText("");
      setMsg({ ok: true, text: "Video जुड़ गया ✓" });
      return router.refresh();
    }

    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return setMsg({ ok: false, text: "Video फ़ाइल चुनो" });
    if (!UPLOAD_TYPES.includes(file.type)) return setMsg({ ok: false, text: "सिर्फ़ MP4, WebM या MOV चलेगा" });
    if (file.size > UPLOAD_MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `फ़ाइल ${UPLOAD_MAX_MB}MB से छोटी हो। बड़े Video के लिए Link वाला तरीका इस्तेमाल करो` });

    setBusy(true);
    let thumbPath: string | undefined;
    if (hasThumb) {
      const t = await uploadCover(thumbFile);
      if (!t.path) { setBusy(false); return setMsg({ ok: false, text: t.error ?? "Thumbnail upload नहीं हुआ" }); }
      thumbPath = t.path;
    }
    const path = `${crypto.randomUUID()}.${EXT[file.type] ?? "mp4"}`;
    const supabase = createClient();
    const up = await supabase.storage.from("course-videos").upload(path, file, { contentType: file.type });
    if (up.error) {
      if (thumbPath) await removeCover(thumbPath);
      setBusy(false);
      return setMsg({ ok: false, text: `Upload नहीं हुआ: ${up.error.message}` });
    }
    const res = await createVideoFromUpload({ ...base, storagePath: path, thumbPath });
    if (res.error) {
      await supabase.storage.from("course-videos").remove([path]); // adhoora upload saaf
      if (thumbPath) await removeCover(thumbPath);
      setBusy(false);
      return setMsg({ ok: false, text: res.error });
    }
    form.reset();
    setBusy(false);
    setMsg({ ok: true, text: "Video Upload हो गया ✓" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="su-chips">
        <button type="button" className={`su-chip ${mode === "link" ? "on" : ""}`} onClick={() => { setMode("link"); setMsg(null); }}>🔗 Link से जोड़ो</button>
        <button type="button" className={`su-chip ${mode === "file" ? "on" : ""}`} onClick={() => { setMode("file"); setMsg(null); }}>⬆️ Video Upload</button>
      </div>
      <label className="su-field"><span>Video का Title</span><input name="title" required maxLength={150} /></label>
      <label className="su-field"><span>छोटा विवरण (ज़रूरी नहीं, अधिकतम 500 अक्षर)</span><textarea name="description" rows={2} maxLength={500} /></label>
      <label className="su-field"><span>Folder</span>
        <select name="folder_id" defaultValue="">
          <option value="">— बिना Folder —</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </label>
      {mode === "link" ? (
        <label className="su-field">
          <span>Video का Link (YouTube, Google Drive, MEGA, सीधा .mp4)</span>
          <input name="url" type="url" inputMode="url" placeholder="https://..." value={linkText} onChange={(e) => setLinkText(e.target.value)} required />
          {detected && <small style={{ color: "var(--mint, #a7f3d0)" }}>✓ {VIDEO_SOURCE_LABEL[detected.source]} Link पहचाना गया</small>}
          {linkText && !detected && <small style={{ color: "#fca5a5" }}>ये Link Player में नहीं चलेगा (Folder Link या अनजान साइट)</small>}
          <small className="su-muted">Drive/MEGA में “Anyone with the link” सेट रखो, वरना Students को Video नहीं दिखेगा।</small>
        </label>
      ) : (
        <label className="su-field">
          <span>Video फ़ाइल (MP4 / WebM / MOV, अधिकतम {UPLOAD_MAX_MB}MB)</span>
          <input name="file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" required style={{ height: "auto", padding: 10 }} />
        </label>
      )}
      <label className="su-field">
        <span>Thumbnail Photo (ज़रूरी नहीं, JPG/PNG/WebP, 2MB तक)</span>
        <input name="thumb" type="file" accept="image/jpeg,image/png,image/webp" style={{ height: "auto", padding: 10 }} />
        <small className="su-muted">YouTube Link की Thumbnail अपने-आप लग जाती है। Drive/MEGA/Upload के लिए खुद लगाओ।</small>
      </label>
      <button type="submit" className="pbtn pbtn-gold" disabled={busy}>{busy ? "हो रहा है…" : mode === "link" ? "🔗 Video जोड़ो" : "⬆️ Upload करो"}</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className="text-[13px]" style={{ color: msg.ok ? "var(--mint, #a7f3d0)" : "#fca5a5" }}>{msg.text}</p>}
    </form>
  );
}

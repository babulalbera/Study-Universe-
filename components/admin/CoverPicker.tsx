"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeCover, uploadCover } from "@/components/admin/cover-upload";
import { coverUrl } from "@/lib/book-meta";
import { setCourseCover, setVideoThumb } from "@/features/admin/course-video-actions";

type Props = { kind: "course" | "video"; courseId: string; videoId?: string; current: string | null; label?: string };

// Course ki cover photo ya Video ki thumbnail lagane/badalne/hatane ke liye
export default function CoverPicker({ kind, courseId, videoId, current, label }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const preview = coverUrl(current);

  const save = (path: string | null) => (kind === "course" ? setCourseCover(courseId, path) : setVideoThumb(courseId, videoId ?? "", path));

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const up = await uploadCover(file);
    if (!up.path) {
      setBusy(false);
      return setMsg(up.error ?? "Upload nahi hua");
    }
    const res = await save(up.path);
    if (res.error) {
      await removeCover(up.path); // adhoori photo saaf
      setBusy(false);
      return setMsg(res.error);
    }
    if (current) await removeCover(current); // purani photo hatao
    setBusy(false);
    router.refresh();
  }

  async function onRemove() {
    setBusy(true);
    setMsg(null);
    const res = await save(null);
    if (res.error) {
      setBusy(false);
      return setMsg(res.error);
    }
    if (current) await removeCover(current);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <span className="text-[13px]">{label ?? (kind === "course" ? "🖼️ Course की Photo" : "🖼️ Video की Thumbnail")}</span>
      <div className="su-row" style={{ alignItems: "center", gap: 12 }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" style={{ width: 128, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10 }} />
        ) : (
          <div style={{ width: 128, aspectRatio: "16 / 9", borderRadius: 10, display: "grid", placeContent: "center", background: "rgba(255,255,255,.06)" }}>🖼️</div>
        )}
        <div className="grid gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} hidden />
          <button type="button" className="pbtn pbtn-gold" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "हो रहा है…" : preview ? "Photo बदलो" : "Photo लगाओ"}
          </button>
          {preview && <button type="button" className="su-btn" disabled={busy} onClick={onRemove}>Photo हटाओ</button>}
        </div>
      </div>
      <small className="su-muted">JPG, PNG या WebP, अधिकतम 2MB। 16:9 (चौड़ी) Photo सबसे अच्छी दिखती है।</small>
      {msg && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{msg}</p>}
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";

type Mode = "auto" | "wide" | "tall";
type Props = { kind: "iframe" | "video"; src: string; title: string; portraitHint?: boolean };

const WIDE = 16 / 9;
const TALL = 9 / 16;
const clamp = (n: number) => Math.min(2.4, Math.max(0.4, n));

// Video ka dabba: seedhe video me asli shape apne aap, baaki me Auto / 16:9 / 9:16 chuno, aur Full Screen.
export default function PlayerStage({ kind, src, title, portraitHint = false }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [ratio, setRatio] = useState<number | null>(null);
  const [fs, setFs] = useState(false);
  const [canFs, setCanFs] = useState(false);

  useEffect(() => {
    try {
      const m = localStorage.getItem("cv-aspect");
      if (m === "wide" || m === "tall") setMode(m);
    } catch { /* storage band ho to Auto hi rahega */ }
    setCanFs(typeof document !== "undefined" && !!document.fullscreenEnabled);
    const onChange = () => setFs(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const pick = (m: Mode) => {
    setMode(m);
    try { localStorage.setItem("cv-aspect", m); } catch { /* chalta hai */ }
  };

  const goFs = () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  const r = mode === "wide" ? WIDE : mode === "tall" ? TALL : clamp(ratio ?? (portraitHint ? TALL : WIDE));
  const style = fs ? undefined : { aspectRatio: String(r), width: r < 1 ? `min(100%, calc(78vh * ${r}))` : "100%" };

  return (
    <div className="cv-player">
      <div className="su-chips" role="group" aria-label="Player ka size">
        <button type="button" className={`su-chip ${mode === "auto" ? "on" : ""}`} onClick={() => pick("auto")}>Auto</button>
        <button type="button" className={`su-chip ${mode === "wide" ? "on" : ""}`} onClick={() => pick("wide")}>▭ 16:9</button>
        <button type="button" className={`su-chip ${mode === "tall" ? "on" : ""}`} onClick={() => pick("tall")}>▯ 9:16</button>
        {canFs && <button type="button" className="su-chip" onClick={goFs}>⛶ Full Screen</button>}
      </div>
      <div ref={box} className={`cv-frame ${fs ? "fs" : ""}`} style={style}>
        {kind === "iframe" ? (
          <iframe
            src={src}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video
            src={src}
            controls
            controlsList="nodownload"
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
            }}
          />
        )}
      </div>
    </div>
  );
}

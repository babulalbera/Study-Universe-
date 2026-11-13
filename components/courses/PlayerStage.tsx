"use client";
import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import "./player.css";

type Mode = "auto" | "wide" | "std" | "tall";
type Props = {
  kind: "iframe" | "video";
  src: string;
  title: string;
  videoId: string; // seedhe video me "jahan chhoda wahin se" yaad rakhne ke liye
  portraitHint?: boolean;
  openUrl?: string | null; // asli link: "बाहर खोलो" ke liye
  nextHref?: string | null; // seedhe video khatam hone par agla video
};

const RATIO = { wide: 16 / 9, std: 4 / 3, tall: 9 / 16 } as const;
const MODES: { id: Mode; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "wide", label: "16:9" },
  { id: "std", label: "4:3" },
  { id: "tall", label: "9:16" },
];
const RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];
const clampRatio = (n: number) => Math.min(2.4, Math.max(0.4, n));
const SLOW_MS = 10_000; // itni der load na ho to "dobara / bahar kholo" ka sujhav
const NEXT_SECONDS = 5;

const lsGet = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const lsSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* storage band ho to chalta hai */ }
};

const sv = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcReload = () => <svg {...sv}><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" /></svg>;
const IcFull = () => <svg {...sv}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
const IcExit = () => <svg {...sv}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;
const IcOpen = () => <svg {...sv}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;

// Video ka dabba: shape apne aap (ya 16:9 / 4:3 / 9:16 chuno), dheema load ho to madad, seedhe video me speed aur resume.
export default function PlayerStage({ kind, src, title, videoId, portraitHint = false, openUrl = null, nextHref = null }: Props) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const lastSave = useRef(0);
  const [mode, setMode] = useState<Mode>("auto");
  const [ratio, setRatio] = useState<number | null>(null);
  const [fs, setFs] = useState(false);
  const [canFs, setCanFs] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0); // "dobara" dabane par player naya ban jata hai
  const [rate, setRate] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const m = lsGet("cv-aspect");
    if (m === "wide" || m === "tall" || m === "std") setMode(m);
    const r = Number(lsGet("cv-rate"));
    if (RATES.includes(r)) setRate(r);
    setCanFs(typeof document !== "undefined" && !!document.fullscreenEnabled);
    const onChange = () => {
      const on = document.fullscreenElement === box.current;
      setFs(on);
      if (!on) {
        try { screen.orientation?.unlock?.(); } catch { /* chalta hai */ }
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Iframe (YouTube/Drive/MEGA) der tak load na ho to sujhav dikhao
  useEffect(() => {
    if (kind !== "iframe" || loaded || failed) return;
    const id = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(id);
  }, [kind, loaded, failed, nonce]);

  useEffect(() => {
    if (vid.current) vid.current.playbackRate = rate;
  }, [rate, nonce]);

  // Seedhe video khatam: 5 second baad agla
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextHref) router.push(nextHref);
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [countdown, nextHref, router]);

  const pick = (m: Mode) => {
    setMode(m);
    lsSet("cv-aspect", m);
  };
  const reload = () => {
    setLoaded(false);
    setSlow(false);
    setFailed(false);
    setCountdown(null);
    setNonce((n) => n + 1);
  };
  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    lsSet("cv-rate", String(next));
  };
  const skip = (d: number) => {
    const v = vid.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + d));
  };

  const r = mode === "auto" ? clampRatio(ratio ?? (portraitHint ? RATIO.tall : RATIO.wide)) : RATIO[mode];

  const goFs = async () => {
    const el = box.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await el.requestFullscreen();
      if (r >= 1) {
        // phone me chaude video ke liye apne aap landscape (jahan browser allow kare)
        const o = screen.orientation as ScreenOrientation & { lock?: (t: string) => Promise<void> };
        await o.lock?.("landscape").catch(() => undefined);
      }
    } catch { /* browser ne allow nahi kiya */ }
  };

  const onMeta = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setLoaded(true);
    if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
    v.playbackRate = rate;
    const t = Number(lsGet(`cv-t:${videoId}`));
    if (t > 5 && Number.isFinite(v.duration) && t < v.duration - 8) v.currentTime = t; // jahan chhoda tha wahin se
  };
  const onTime = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const now = Date.now();
    if (!v.currentTime || now - lastSave.current < 4000) return;
    lastSave.current = now;
    lsSet(`cv-t:${videoId}`, String(Math.floor(v.currentTime)));
  };
  const onEnded = () => {
    try { localStorage.removeItem(`cv-t:${videoId}`); } catch { /* chalta hai */ }
    if (nextHref) setCountdown(NEXT_SECONDS);
  };

  const style: CSSProperties | undefined = fs ? undefined : { aspectRatio: String(r), width: `min(100%, calc(78vh * ${r}))` };

  return (
    <div className="cvp">
      <div ref={box} className={`cvp-frame${fs ? " fs" : ""}`} style={style}>
        {kind === "iframe" ? (
          <iframe
            key={nonce}
            src={src}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <video
            key={nonce}
            ref={vid}
            src={src}
            controls
            controlsList="nodownload"
            playsInline
            preload="metadata"
            onLoadedMetadata={onMeta}
            onTimeUpdate={onTime}
            onEnded={onEnded}
            onError={() => setFailed(true)}
          />
        )}

        {!loaded && !failed && !slow && (
          <div className="cvp-load" role="status">
            <span className="cvp-ring" aria-hidden="true" />
            <p>Video khul raha hai…</p>
          </div>
        )}
        {!loaded && !failed && slow && (
          <div className="cvp-hint" role="status">
            <p>Abhi tak load nahi hua. Net dhimi ho sakti hai.</p>
            <div>
              <button type="button" className="cvp-ib" onClick={reload}><IcReload /> Dobara</button>
              {openUrl && <a className="cvp-ib" href={openUrl} target="_blank" rel="noopener noreferrer"><IcOpen /> बाहर खोलो</a>}
            </div>
          </div>
        )}
        {failed && (
          <div className="cvp-err" role="alert">
            <span aria-hidden="true">⚠️</span>
            <p>Ye video chal nahi paya.</p>
            <div>
              <button type="button" className="cvp-ib" onClick={reload}><IcReload /> Dobara</button>
              {openUrl && <a className="cvp-ib" href={openUrl} target="_blank" rel="noopener noreferrer"><IcOpen /> बाहर खोलो</a>}
            </div>
          </div>
        )}
        {countdown !== null && nextHref && (
          <div className="cvp-next" role="status">
            <p>Agla video {Math.max(countdown, 0)} second me…</p>
            <div>
              <button type="button" className="cvp-ib cvp-ib-gold" onClick={() => router.push(nextHref)}>Abhi chalao</button>
              <button type="button" className="cvp-ib" onClick={() => setCountdown(null)}>Ruko</button>
            </div>
          </div>
        )}
      </div>

      <div className="cvp-bar">
        <div className="cvp-seg" role="group" aria-label="Player ka size">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={mode === m.id ? "on" : ""} aria-pressed={mode === m.id} onClick={() => pick(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="cvp-tools">
          {kind === "video" && (
            <>
              <button type="button" className="cvp-ib" onClick={() => skip(-10)} aria-label="10 second peeche">−10s</button>
              <button type="button" className="cvp-ib" onClick={cycleRate} aria-label={`Speed ${rate}x, badalne ke liye dabao`}>{rate}x</button>
              <button type="button" className="cvp-ib" onClick={() => skip(10)} aria-label="10 second aage">+10s</button>
            </>
          )}
          <button type="button" className="cvp-ib" onClick={reload} aria-label="Player dobara chalao"><IcReload /></button>
          {canFs && (
            <button type="button" className="cvp-ib" onClick={() => void goFs()} aria-label={fs ? "Full screen band" : "Full screen"}>
              {fs ? <IcExit /> : <IcFull />}
            </button>
          )}
          {openUrl && (
            <a className="cvp-ib" href={openUrl} target="_blank" rel="noopener noreferrer" aria-label="Video ko bahar kholo"><IcOpen /></a>
          )}
        </div>
      </div>
    </div>
  );
}

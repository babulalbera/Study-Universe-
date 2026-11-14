"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import CustomVideo from "./CustomVideo";
import { useYouTube } from "./useYouTube";
import { clearPos, getAutoNext, getDone, getPos, getRate, nextRate, onDoneChange, saveAutoNext, savePos, saveRate, setDone } from "@/lib/course-progress";
import "./player.css";

type Mode = "auto" | "wide" | "std" | "tall";
type Props = {
  kind: "iframe" | "video";
  src: string;
  title: string;
  videoId: string;
  courseId: string;
  source: string; // youtube / drive / mega / direct / upload
  portraitHint?: boolean;
  openUrl?: string | null; // asli link: "बाहर खोलो" ke liye
  nextHref?: string | null; // video khatam hone par agla video
};

const RATIO = { wide: 16 / 9, std: 4 / 3, tall: 9 / 16 } as const;
const MODES: { id: Mode; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "wide", label: "16:9" },
  { id: "std", label: "4:3" },
  { id: "tall", label: "9:16" },
];
const clampRatio = (n: number) => Math.min(2.4, Math.max(0.4, n));
const SLOW_MS = 10_000; // itni der load na ho to "dobara / bahar kholo" ka sujhav
const NEXT_SECONDS = 5;
const DONE_AT = 0.9; // 90% dekha to "complete"

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
const IcCheck = () => <svg {...sv}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;

// Video ka dabba: shape apne aap, dheema load ho to madad, "complete" ka hisaab, auto-next.
// Seedhe video me apna player, YouTube me speed/resume (agar YouTube jawab de), Drive/MEGA me unka apna player.
export default function PlayerStage({ kind, src, title, videoId, courseId, source, portraitHint = false, openUrl = null, nextHref = null }: Props) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSave = useRef(0);
  const doneRef = useRef(false);
  const ytInit = useRef(false);
  const ytEnded = useRef(false);
  const [mode, setMode] = useState<Mode>("auto");
  const [ratio, setRatio] = useState<number | null>(null);
  const [fs, setFs] = useState(false);
  const [canFs, setCanFs] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0); // "dobara" dabane par player naya ban jata hai
  const [rate, setRate] = useState(1);
  const [done, setDoneState] = useState(false);
  const [autoNext, setAutoNextState] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [touched, setTouched] = useState(false); // Drive/MEGA: user ne video ko chhua ya nahi

  const isYt = source === "youtube" && kind === "iframe";
  const yt = useYouTube(iframeRef, isYt, loaded, nonce);

  useEffect(() => {
    const m = lsGet("cv-aspect");
    if (m === "wide" || m === "tall" || m === "std") setMode(m);
    setRate(getRate());
    setAutoNextState(getAutoNext());
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

  // "Complete" ka hisaab (doosre tab me badle to bhi yahan dikhe)
  useEffect(() => {
    const sync = () => {
      const on = getDone(courseId).includes(videoId);
      doneRef.current = on;
      setDoneState(on);
    };
    sync();
    return onDoneChange(courseId, sync);
  }, [courseId, videoId]);

  // Iframe (YouTube/Drive/MEGA) der tak load na ho to sujhav dikhao
  useEffect(() => {
    if (kind !== "iframe" || loaded || failed) return;
    const id = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(id);
  }, [kind, loaded, failed, nonce]);

  // Drive/MEGA ka apna player pehle se ruka hota hai: jab tak chhua na jaye "tap karo" ka sujhav (sujhav tap ko rokta nahi)
  useEffect(() => {
    if (kind !== "iframe" || isYt || !loaded || touched) return;
    const onBlur = () => {
      if (document.activeElement === iframeRef.current) setTouched(true);
    };
    window.addEventListener("blur", onBlur);
    const id = window.setTimeout(() => setTouched(true), 9000);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.clearTimeout(id);
    };
  }, [kind, isYt, loaded, touched]);

  // Khatam hone ke baad 5 second me agla video
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextHref) router.push(nextHref);
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [countdown, nextHref, router]);

  const markDone = (on: boolean) => {
    doneRef.current = on;
    setDoneState(on);
    setDone(courseId, videoId, on);
  };
  const tick = (t: number, d: number) => {
    if (d > 0 && t / d >= DONE_AT && !doneRef.current) markDone(true);
  };
  const ended = () => {
    clearPos(videoId);
    markDone(true);
    if (autoNext && nextHref) setCountdown(NEXT_SECONDS);
  };

  // YouTube ne jo bataya (samay / halat): resume, speed, complete, auto-next
  useEffect(() => {
    const i = yt.info;
    if (!i) return;
    if (!ytInit.current && i.duration > 0) {
      ytInit.current = true;
      const t = getPos(videoId);
      if (t > 5 && t < i.duration - 8) yt.seek(t);
      if (rate !== 1) yt.setRate(rate);
    }
    if (i.state === 1) {
      tick(i.time, i.duration);
      const now = Date.now();
      if (now - lastSave.current > 4000) {
        lastSave.current = now;
        savePos(videoId, i.time);
      }
    }
    if (i.state === 0 && !ytEnded.current) {
      ytEnded.current = true;
      ended();
    }
    if (i.state !== 0) ytEnded.current = false;
  }, [yt.info]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (m: Mode) => {
    setMode(m);
    lsSet("cv-aspect", m);
  };
  const reload = () => {
    setLoaded(false);
    setSlow(false);
    setFailed(false);
    setCountdown(null);
    setTouched(false);
    ytInit.current = false;
    setNonce((n) => n + 1);
  };
  const changeRate = (r: number) => {
    setRate(r);
    saveRate(r);
    if (isYt) yt.setRate(r);
  };
  const toggleAutoNext = () => {
    const on = !autoNext;
    setAutoNextState(on);
    saveAutoNext(on);
    if (!on) setCountdown(null);
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

  const style: CSSProperties | undefined = fs ? undefined : { aspectRatio: String(r), width: `min(100%, calc(78vh * ${r}))` };
  const ytTools = isYt && yt.info;

  return (
    <div className="cvp">
      <div ref={box} className={`cvp-frame${fs ? " fs" : ""}`} style={style}>
        {kind === "iframe" ? (
          <iframe
            key={nonce}
            ref={iframeRef}
            src={src}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <CustomVideo
            key={nonce}
            src={src}
            title={title}
            videoId={videoId}
            rate={rate}
            onRate={changeRate}
            full={fs}
            canFull={canFs}
            onFull={() => void goFs()}
            onRatio={setRatio}
            onTick={tick}
            onEnded={ended}
            onFail={() => setFailed(true)}
            onReady={() => setLoaded(true)}
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
        {loaded && !failed && !isYt && kind === "iframe" && !touched && (
          <div className="cvp-tap" aria-hidden="true">▶ Chalane ke liye video par tap karo</div>
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
          {ytTools && (
            <>
              <button type="button" className="cvp-ib" onClick={() => yt.seek(yt.info!.time - 10)} aria-label="10 second peeche">−10s</button>
              <button type="button" className="cvp-ib" onClick={() => changeRate(nextRate(rate))} aria-label={`Speed ${rate}x, badalne ke liye dabao`}>{rate}x</button>
              <button type="button" className="cvp-ib" onClick={() => yt.seek(yt.info!.time + 10)} aria-label="10 second aage">+10s</button>
            </>
          )}
          <button type="button" className={`cvp-ib cvp-done${done ? " on" : ""}`} onClick={() => markDone(!done)} aria-pressed={done}>
            <IcCheck /> {done ? "Complete" : "Mark complete"}
          </button>
          {nextHref && (
            <button type="button" className={`cvp-ib${autoNext ? " on" : ""}`} onClick={toggleAutoNext} aria-pressed={autoNext} title="Video khatam hone par agla apne aap chale (sirf YouTube aur seedhe video me)">
              Auto-next {autoNext ? "ON" : "OFF"}
            </button>
          )}
          <button type="button" className="cvp-ib" onClick={reload} aria-label="Player dobara chalao"><IcReload /></button>
          {canFs && kind === "iframe" && (
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

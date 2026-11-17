"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import CustomVideo from "./CustomVideo";
import { useYouTube } from "./useYouTube";
import { clearPos, getAutoNext, getDone, getPos, getRate, onDoneChange, saveAutoNext, savePos, saveRate, setDone } from "@/lib/course-progress";
import "./player.css";
import "./player-settings.css";

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
const RATES = [0.75, 1, 1.25, 1.5, 2];
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
const IcBack = () => <svg {...sv}><path d="m15 5-7 7 7 7" /></svg>;
const IcGear = () => (
  <svg {...sv} width={20} height={20}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

// Video ka dabba: shape apne aap, dheema load ho to madad, "complete" ka hisaab, auto-next.
// Seedhe video me apna player, YouTube me speed/resume (agar YouTube jawab de), Drive/MEGA me unka apna player.
// Saare control ab ek Settings (gear) sheet me hain, aur upar "Wapas" button.
export default function PlayerStage({ kind, src, title, videoId, courseId, source, portraitHint = false, openUrl = null, nextHref = null }: Props) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSave = useRef(0);
  const doneRef = useRef(false);
  const ytInit = useRef(false);
  const ytEnded = useRef(false);
  const wake = useRef<WakeLockSentinel | null>(null);
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
  const [menu, setMenu] = useState(false); // Settings sheet khuli hai ya nahi
  const [canWake, setCanWake] = useState(false);
  const [awake, setAwake] = useState(false);
  const [copied, setCopied] = useState(false);

  const isYt = source === "youtube" && kind === "iframe";
  const yt = useYouTube(iframeRef, isYt, loaded, nonce);

  useEffect(() => {
    const m = lsGet("cv-aspect");
    if (m === "wide" || m === "tall" || m === "std") setMode(m);
    setRate(getRate());
    setAutoNextState(getAutoNext());
    setCanFs(typeof document !== "undefined" && !!document.fullscreenEnabled);
    setCanWake(typeof navigator !== "undefined" && "wakeLock" in navigator);
    const onChange = () => {
      const on = document.fullscreenElement === box.current;
      setFs(on);
      if (!on) {
        try { screen.orientation?.unlock?.(); } catch { /* chalta hai */ }
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      void wake.current?.release().catch(() => undefined); // page chhodte hi screen-on band
    };
  }, []);

  // Settings sheet: Esc dabane par band
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

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

  // Wapas: hamesha is course ke page par (auto-next ke baad bhi seedha sahi jagah)
  const goBack = () => router.push(`/courses/${courseId}`);

  // Padhte waqt screen band na ho
  const toggleAwake = async () => {
    try {
      if (wake.current) {
        await wake.current.release();
        wake.current = null;
        setAwake(false);
        return;
      }
      const lock = await navigator.wakeLock.request("screen");
      wake.current = lock;
      setAwake(true);
      lock.addEventListener("release", () => {
        wake.current = null;
        setAwake(false);
      });
    } catch { /* browser ne allow nahi kiya */ }
  };

  // Is video ka link share / copy
  const shareLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* user ne cancel kiya ya browser ne roka */ }
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

  const close = () => setMenu(false);
  const style: CSSProperties | undefined = fs ? undefined : { aspectRatio: String(r), width: `min(100%, calc(78vh * ${r}))` };
  const ytTools = isYt && yt.info;

  return (
    <div className="cvp">
      <div className="cvp-topbar">
        <button type="button" className="cvp-ib cvp-back" onClick={goBack} aria-label="Course page par wapas jao">
          <IcBack /> Wapas
        </button>
        <button type="button" className={`cvp-ib cvp-gear${menu ? " on" : ""}`} onClick={() => setMenu(true)} aria-label="Settings" aria-haspopup="dialog" aria-expanded={menu}>
          <IcGear />
        </button>
      </div>

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

      {menu &&
        createPortal(
          <>
            <div className="cvs-back" onClick={close} />
            <div className="cvs" role="dialog" aria-modal="true" aria-label="Player settings">
              <div className="cvs-head">
                <h3>Settings</h3>
                <button type="button" className="cvp-ib" onClick={close} aria-label="Settings band karo">✕</button>
              </div>

              <div className="cvs-sec">
                <p className="cvs-h">Player size</p>
                <div className="cvp-seg" role="group" aria-label="Player ka size">
                  {MODES.map((m) => (
                    <button key={m.id} type="button" className={mode === m.id ? "on" : ""} aria-pressed={mode === m.id} onClick={() => pick(m.id)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {(kind === "video" || ytTools) && (
                <div className="cvs-sec">
                  <p className="cvs-h">Speed</p>
                  <div className="cvs-row cvs-chips">
                    {RATES.map((x) => (
                      <button key={x} type="button" className={`cvp-ib${rate === x ? " on" : ""}`} aria-pressed={rate === x} onClick={() => changeRate(x)}>
                        {x}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ytTools && (
                <div className="cvs-sec">
                  <p className="cvs-h">Aage / peeche</p>
                  <div className="cvs-row">
                    <button type="button" className="cvp-ib" onClick={() => yt.seek(yt.info!.time - 10)}>−10s</button>
                    <button type="button" className="cvp-ib" onClick={() => yt.seek(yt.info!.time + 10)}>+10s</button>
                  </div>
                </div>
              )}

              <div className="cvs-sec">
                <p className="cvs-h">Padhai</p>
                <div className="cvs-row">
                  <button type="button" className={`cvp-ib cvp-done${done ? " on" : ""}`} onClick={() => markDone(!done)} aria-pressed={done}>
                    <IcCheck /> {done ? "Complete" : "Mark complete"}
                  </button>
                  {nextHref && (
                    <button type="button" className={`cvp-ib${autoNext ? " on" : ""}`} onClick={toggleAutoNext} aria-pressed={autoNext} title="Video khatam hone par agla apne aap chale (sirf YouTube aur seedhe video me)">
                      Auto-next {autoNext ? "ON" : "OFF"}
                    </button>
                  )}
                </div>
              </div>

              <div className="cvs-sec">
                <p className="cvs-h">Aur options</p>
                <div className="cvs-row">
                  {canWake && (
                    <button type="button" className={`cvp-ib${awake ? " on" : ""}`} onClick={() => void toggleAwake()} aria-pressed={awake}>
                      Screen ON {awake ? "✓" : ""}
                    </button>
                  )}
                  <button type="button" className="cvp-ib" onClick={() => void shareLink()}>{copied ? "Link copy ho gaya ✓" : "Link share"}</button>
                  <button type="button" className="cvp-ib" onClick={() => { close(); reload(); }}><IcReload /> Dobara chalao</button>
                  {canFs && kind === "iframe" && (
                    <button type="button" className="cvp-ib" onClick={() => { close(); void goFs(); }}>
                      {fs ? <IcExit /> : <IcFull />} Full screen
                    </button>
                  )}
                  {openUrl && (
                    <a className="cvp-ib" href={openUrl} target="_blank" rel="noopener noreferrer" onClick={close}><IcOpen /> बाहर खोलो</a>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

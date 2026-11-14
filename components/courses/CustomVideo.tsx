"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type SyntheticEvent } from "react";
import { clearPos, getPos, nextRate, savePos } from "@/lib/course-progress";

type Props = {
  src: string;
  title: string;
  videoId: string;
  rate: number;
  onRate: (r: number) => void;
  full: boolean;
  canFull: boolean;
  onFull: () => void;
  onRatio: (r: number) => void;
  onTick: (t: number, d: number) => void; // dekhne ka hisaab (90% par "complete")
  onEnded: () => void;
  onFail: () => void;
  onReady: () => void;
};

const sv = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true };
const stroke = { ...sv, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IcPlay = () => <svg {...sv}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>;
const IcPause = () => <svg {...sv}><rect x="6" y="5" width="4.5" height="14" rx="1.2" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.2" /></svg>;
const IcVol = () => <svg {...stroke}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>;
const IcMute = () => <svg {...stroke}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></svg>;
const IcPip = () => <svg {...stroke}><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>;
const IcFull = () => <svg {...stroke}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
const IcExit = () => <svg {...stroke}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

// Apna video player (seedhe / upload kiye video ke liye): double-tap se ±10s, speed, volume, PiP, full screen, keyboard.
export default function CustomVideo(p: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const hideT = useRef<number | undefined>(undefined);
  const lastTap = useRef({ t: 0, x: 0 });
  const lastSave = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [show, setShow] = useState(true);
  const [wait, setWait] = useState(true);
  const [canPip, setCanPip] = useState(false);
  const [flash, setFlash] = useState<{ side: "l" | "r"; id: number } | null>(null);

  useEffect(() => {
    setCanPip(typeof document !== "undefined" && !!document.pictureInPictureEnabled);
    return () => window.clearTimeout(hideT.current);
  }, []);
  useEffect(() => {
    if (vid.current) vid.current.playbackRate = p.rate;
  }, [p.rate]);
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 650);
    return () => window.clearTimeout(id);
  }, [flash]);

  const poke = useCallback(() => {
    setShow(true);
    window.clearTimeout(hideT.current);
    hideT.current = window.setTimeout(() => {
      if (vid.current && !vid.current.paused) setShow(false);
    }, 2800);
  }, []);

  const toggle = () => {
    const el = vid.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };
  const seekBy = (d: number) => {
    const el = vid.current;
    if (el) el.currentTime = Math.max(0, Math.min(el.duration || Infinity, el.currentTime + d));
  };
  const setVolume = (v: number) => {
    const el = vid.current;
    if (!el) return;
    el.volume = Math.min(1, Math.max(0, v));
    if (el.volume > 0) el.muted = false;
  };
  const toggleMute = () => {
    const el = vid.current;
    if (el) el.muted = !el.muted;
  };
  const togglePip = () => {
    const el = vid.current;
    if (!el) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined);
    else void el.requestPictureInPicture?.().catch(() => undefined);
  };

  const onMeta = (e: SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    setDur(el.duration || 0);
    setWait(false);
    if (el.videoWidth && el.videoHeight) p.onRatio(el.videoWidth / el.videoHeight);
    el.playbackRate = p.rate;
    const t = getPos(p.videoId);
    if (t > 5 && Number.isFinite(el.duration) && t < el.duration - 8) el.currentTime = t; // jahan chhoda tha wahin se
    p.onReady();
  };
  const onTime = (e: SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    setTime(el.currentTime);
    p.onTick(el.currentTime, el.duration || 0);
    const now = Date.now();
    if (el.currentTime && now - lastSave.current > 4000) {
      lastSave.current = now;
      savePos(p.videoId, el.currentTime);
    }
  };
  const onBuffer = (e: SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    let end = 0;
    for (let i = 0; i < el.buffered.length; i++) if (el.buffered.start(i) <= el.currentTime + 0.5) end = Math.max(end, el.buffered.end(i));
    setBuf(end);
  };
  const onVolume = (e: SyntheticEvent<HTMLVideoElement>) => {
    setVol(e.currentTarget.volume);
    setMuted(e.currentTarget.muted);
  };

  const onTap = (e: PointerEvent<HTMLDivElement>) => {
    wrap.current?.focus({ preventScroll: true });
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const now = Date.now();
    const lt = lastTap.current;
    const dbl = now - lt.t < 320 && Math.abs(e.clientX - lt.x) < 70;
    lastTap.current = { t: dbl ? 0 : now, x: e.clientX };
    if (e.pointerType === "mouse") {
      toggle(); // click = play/pause, double-click = full screen
      if (dbl) p.onFull();
      return;
    }
    if (dbl) {
      if (x < 0.35) {
        seekBy(-10);
        setFlash({ side: "l", id: now });
      } else if (x > 0.65) {
        seekBy(10);
        setFlash({ side: "r", id: now });
      } else toggle();
      poke();
    } else if (show && playing) {
      window.clearTimeout(hideT.current);
      setShow(false);
    } else poke();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const k = e.key;
    if (k === " " || k === "k") toggle();
    else if (k === "ArrowRight") seekBy(5);
    else if (k === "ArrowLeft") seekBy(-5);
    else if (k === "l") seekBy(10);
    else if (k === "j") seekBy(-10);
    else if (k === "ArrowUp") setVolume(vol + 0.1);
    else if (k === "ArrowDown") setVolume(vol - 0.1);
    else if (k === "m") toggleMute();
    else if (k === "f") p.onFull();
    else return;
    e.preventDefault();
    poke();
  };

  const pct = dur > 0 ? (time / dur) * 100 : 0;
  const bpct = dur > 0 ? (buf / dur) * 100 : 0;
  const seekStyle = { ["--p" as string]: `${pct}%`, ["--b" as string]: `${bpct}%` } as CSSProperties;
  const uiOn = show || !playing;

  return (
    <div ref={wrap} className="cvv" tabIndex={0} onKeyDown={onKey} onMouseMove={poke} aria-label={p.title}>
      <video
        ref={vid}
        src={p.src}
        playsInline
        preload="metadata"
        onLoadedMetadata={onMeta}
        onTimeUpdate={onTime}
        onProgress={onBuffer}
        onVolumeChange={onVolume}
        onPlay={() => { setPlaying(true); poke(); }}
        onPause={() => { setPlaying(false); setShow(true); window.clearTimeout(hideT.current); }}
        onWaiting={() => setWait(true)}
        onPlaying={() => setWait(false)}
        onCanPlay={() => setWait(false)}
        onEnded={() => { clearPos(p.videoId); setPlaying(false); setShow(true); p.onEnded(); }}
        onError={p.onFail}
      />
      <div className="cvv-tap" onPointerUp={onTap} />

      {wait && <span className="cvv-wait cvp-ring" aria-hidden="true" />}
      {flash && <span key={flash.id} className={`cvv-flash ${flash.side}`} aria-hidden="true">{flash.side === "l" ? "« 10s" : "10s »"}</span>}

      <div className={`cvv-ui${uiOn ? " on" : ""}`}>
        <div className="cvv-top"><span>{p.title}</span></div>
        {!playing && !wait && (
          <button type="button" className="cvv-big" onClick={toggle} aria-label="Chalao"><IcPlay /></button>
        )}
        <div className="cvv-bottom">
          <input
            className="cvv-seek"
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={Math.min(time, dur || 0)}
            style={seekStyle}
            disabled={!dur}
            aria-label="Video me aage-peeche"
            onChange={(e) => {
              const t = Number(e.target.value);
              if (vid.current) vid.current.currentTime = t;
              setTime(t);
              poke();
            }}
          />
          <div className="cvv-row">
            <button type="button" className="cvv-b" onClick={toggle} aria-label={playing ? "Roko" : "Chalao"}>{playing ? <IcPause /> : <IcPlay />}</button>
            <button type="button" className="cvv-b cvv-t cvv-skip" onClick={() => seekBy(-10)} aria-label="10 second peeche">−10</button>
            <button type="button" className="cvv-b cvv-t cvv-skip" onClick={() => seekBy(10)} aria-label="10 second aage">+10</button>
            <span className="cvv-time">{fmt(time)} / {fmt(dur)}</span>
            <span className="cvv-sp" />
            <button type="button" className="cvv-b" onClick={toggleMute} aria-label={muted || vol === 0 ? "Awaaz chalu" : "Awaaz band"}>{muted || vol === 0 ? <IcMute /> : <IcVol />}</button>
            <input className="cvv-vol" type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol} style={{ ["--p" as string]: `${(muted ? 0 : vol) * 100}%` } as CSSProperties} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Awaaz" />
            <button type="button" className="cvv-b cvv-t" onClick={() => p.onRate(nextRate(p.rate))} aria-label={`Speed ${p.rate}x`}>{p.rate}x</button>
            {canPip && <button type="button" className="cvv-b" onClick={togglePip} aria-label="Chhoti window me chalao"><IcPip /></button>}
            {p.canFull && <button type="button" className="cvv-b" onClick={p.onFull} aria-label={p.full ? "Full screen band" : "Full screen"}>{p.full ? <IcExit /> : <IcFull />}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type YtInfo = { time: number; duration: number; state: number; rate: number };

// YouTube ke iframe se baat (postMessage): chalne ka samay, speed, khatam hua ya nahi.
// Agar YouTube jawab na de to info null rehta hai aur extra buttons dikhte hi nahi (kuch toota nahi).
export function useYouTube(iframe: RefObject<HTMLIFrameElement | null>, enabled: boolean, loaded: boolean, nonce: number) {
  const [info, setInfo] = useState<YtInfo | null>(null);
  const last = useRef<YtInfo | null>(null);
  const idRef = useRef("cvp-yt");

  const post = useCallback(
    (func: string, args: unknown[] = []) => {
      const w = iframe.current?.contentWindow;
      if (!w) return;
      w.postMessage(JSON.stringify({ event: "command", func, args, id: idRef.current, channel: "widget" }), "*");
    },
    [iframe],
  );

  useEffect(() => {
    last.current = null;
    setInfo(null);
  }, [nonce]);

  useEffect(() => {
    if (!enabled || !loaded) return;
    const onMsg = (e: MessageEvent) => {
      const w = iframe.current?.contentWindow;
      if (!w || e.source !== w) return;
      let data: unknown = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== "object") return;
      const d = data as { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number; playbackRate?: number } };
      if ((d.event !== "infoDelivery" && d.event !== "initialDelivery") || !d.info) return;
      const prev = last.current;
      const next: YtInfo = {
        time: d.info.currentTime ?? prev?.time ?? 0,
        duration: d.info.duration ?? prev?.duration ?? 0,
        state: d.info.playerState ?? prev?.state ?? -1,
        rate: d.info.playbackRate ?? prev?.rate ?? 1,
      };
      last.current = next;
      // har 250ms par dobara na banao: sirf jab second, halat ya speed badle
      if (!prev || Math.floor(prev.time) !== Math.floor(next.time) || prev.state !== next.state || prev.rate !== next.rate || prev.duration !== next.duration) setInfo(next);
    };
    window.addEventListener("message", onMsg);

    const handshake = () => {
      const w = iframe.current?.contentWindow;
      if (w) w.postMessage(JSON.stringify({ event: "listening", id: idRef.current, channel: "widget" }), "*");
    };
    handshake();
    const timers = [400, 1200, 2500, 5000].map((ms) => window.setTimeout(() => { if (!last.current) handshake(); }, ms));

    return () => {
      window.removeEventListener("message", onMsg);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [enabled, loaded, nonce, iframe]);

  const seek = useCallback((sec: number) => post("seekTo", [Math.max(0, sec), true]), [post]);
  const setRate = useCallback((r: number) => post("setPlaybackRate", [r]), [post]);

  return { info, seek, setRate };
}

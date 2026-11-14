"use client";
// HLS (.m3u8) aur DASH (.mpd) videos chalane ka engine, quality chunne ke saath.
// Library tabhi aati hai jab aisa video khule (jsDelivr se, pakka version). Normal videos par koi asar nahi.
// Dhyan: ye sirf aam (bina DRM wale) streams chalata hai.
export type StreamKind = "hls" | "dash";
export type Level = { id: number; label: string };
export type StreamHandle = { setLevel: (id: number) => void; destroy: () => void }; // id -1 = Auto

const HLS_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js";
const DASH_URL = "https://cdn.jsdelivr.net/npm/dashjs@4.7.4/dist/dash.all.min.js";

type HlsLevel = { height?: number; bitrate?: number };
type HlsInstance = {
  levels: HlsLevel[];
  currentLevel: number;
  loadSource(src: string): void;
  attachMedia(el: HTMLMediaElement): void;
  on(ev: string, cb: (...a: unknown[]) => void): void;
  startLoad(): void;
  recoverMediaError(): void;
  destroy(): void;
};
type HlsCtor = { new (cfg?: Record<string, unknown>): HlsInstance; isSupported(): boolean; Events: Record<string, string> };
type DashInfo = { height?: number; bitrate?: number; qualityIndex?: number };
type DashPlayer = {
  initialize(el: HTMLMediaElement, src: string, autoPlay: boolean): void;
  on(ev: string, cb: (...a: unknown[]) => void): void;
  getBitrateInfoListFor(type: string): DashInfo[];
  setQualityFor(type: string, index: number): void;
  updateSettings(s: Record<string, unknown>): void;
  reset(): void;
};
type DashGlobal = { MediaPlayer(): { create(): DashPlayer } };
const globals = () => window as unknown as { Hls?: HlsCtor; dashjs?: DashGlobal };

export function streamKindOf(src: string): StreamKind | null {
  try {
    const path = new URL(src, "https://x.invalid").pathname.toLowerCase();
    if (path.endsWith(".m3u8")) return "hls";
    if (path.endsWith(".mpd")) return "dash";
  } catch { /* kharab link: stream nahi */ }
  return null;
}

const loading = new Map<string, Promise<void>>();
function loadScript(url: string): Promise<void> {
  const hit = loading.get(url);
  if (hit) return hit;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => {
      loading.delete(url); // agli baar dobara koshish ho sake
      reject(new Error("Player library load nahi hui"));
    };
    document.head.appendChild(s);
  });
  loading.set(url, p);
  return p;
}

// Quality ki list: bade se chhota, ek jaisi height wali ek hi baar
function toLevels(list: { id: number; height?: number; bitrate?: number }[]): Level[] {
  const seen = new Set<string>();
  return list
    .map((l) => ({ id: l.id, key: l.height ? l.height : Math.round((l.bitrate ?? 0) / 1000), label: l.height ? `${l.height}p` : `${Math.round((l.bitrate ?? 0) / 1000)} kbps`, bitrate: l.bitrate ?? 0 }))
    .sort((a, b) => b.key - a.key || b.bitrate - a.bitrate)
    .filter((l) => (seen.has(l.label) ? false : (seen.add(l.label), true)))
    .map(({ id, label }) => ({ id, label }));
}

export async function attachStream(
  kind: StreamKind,
  el: HTMLVideoElement,
  src: string,
  hooks: { onLevels: (l: Level[]) => void; onFail: () => void },
): Promise<StreamHandle> {
  if (kind === "hls") {
    // Safari aur kai phone seedha HLS chala lete hain
    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
      return {
        setLevel: () => undefined,
        destroy: () => {
          el.removeAttribute("src");
          el.load();
        },
      };
    }
    await loadScript(HLS_URL);
    const H = globals().Hls;
    if (!H || !H.isSupported()) throw new Error("Is browser me HLS nahi chalta");
    const hls = new H({ enableWorker: true });
    let netTries = 0;
    let mediaTries = 0;
    hls.on(H.Events.MANIFEST_PARSED, () => hooks.onLevels(toLevels(hls.levels.map((l, id) => ({ id, height: l.height, bitrate: l.bitrate })))));
    hls.on(H.Events.ERROR, (...a: unknown[]) => {
      const d = a[1] as { fatal?: boolean; type?: string } | undefined;
      if (!d?.fatal) return;
      if (d.type === "networkError" && netTries++ < 2) hls.startLoad();
      else if (d.type === "mediaError" && mediaTries++ < 2) hls.recoverMediaError();
      else hooks.onFail();
    });
    hls.loadSource(src);
    hls.attachMedia(el);
    return {
      setLevel: (id) => {
        hls.currentLevel = id;
      },
      destroy: () => hls.destroy(),
    };
  }

  await loadScript(DASH_URL);
  const D = globals().dashjs;
  if (!D) throw new Error("DASH library nahi mili");
  const player = D.MediaPlayer().create();
  const auto = (on: boolean) => player.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: on } } } });
  auto(true);
  player.on("streamInitialized", () => {
    const list = player.getBitrateInfoListFor("video");
    hooks.onLevels(toLevels(list.map((l, i) => ({ id: l.qualityIndex ?? i, height: l.height, bitrate: l.bitrate }))));
  });
  player.on("error", () => hooks.onFail());
  player.initialize(el, src, false);
  return {
    setLevel: (id) => {
      if (id < 0) auto(true);
      else {
        auto(false);
        player.setQualityFor("video", id);
      }
    },
    destroy: () => {
      try { player.reset(); } catch { /* pehle hi band */ }
    },
  };
}

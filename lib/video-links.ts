// Video ke links ko jaanchna aur player ke liye sahi URL banana.
// Server aur browser dono jagah chalta hai, isliye "server-only" nahi lagaya.
import { embedUrl, parseBookLink } from "@/lib/book-links";

export type VideoSource = "youtube" | "drive" | "mega" | "direct" | "upload";

export const VIDEO_SOURCE_LABEL: Record<VideoSource, string> = {
  youtube: "YouTube",
  drive: "Google Drive",
  mega: "MEGA",
  direct: "Direct Video",
  upload: "Upload",
};

export const VIDEO_LINK_ERR = "Link player me nahi chalega. YouTube, Google Drive, MEGA ya seedha .mp4 / .m3u8 (HLS) / .mpd (DASH) file ka https:// link daalo (folder link nahi chalta)";

export const UPLOAD_MAX_MB = 50;
export const UPLOAD_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
export const UPLOAD_PATH_RE = /^[0-9a-f-]{36}\.(mp4|webm|mov|m4v)$/i;

const YT_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];
const DIRECT_EXT = /\.(mp4|webm|mov|m4v|ogv|m3u8|mpd)$/i; // m3u8 = HLS, mpd = DASH (quality chunne wala stream)
const ID11 = /^[\w-]{11}$/;
const LIST_ID = /^[\w-]{10,60}$/;

const hostIs = (h: string, d: string) => h === d || h.endsWith(`.${d}`);

// YouTube link se 11 akshar ki video id nikalo (playlist-only link par null)
export function ytId(u: URL): string | null {
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const seg = u.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (host === "youtu.be") id = seg[0] ?? null;
  else if (u.pathname === "/watch") id = u.searchParams.get("v");
  else if (["embed", "shorts", "live", "v"].includes(seg[0] ?? "")) id = seg[1] ?? null;
  if (id === "videoseries") id = null;
  return id && ID11.test(id) ? id : null;
}

function ytEmbed(u: URL): string | null {
  const id = ytId(u);
  if (id) return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
  const list = u.searchParams.get("list");
  if (list && LIST_ID.test(list)) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&rel=0&playsinline=1`;
  return null;
}

export function parseVideoLink(raw: string): { source: VideoSource; url: string } | null {
  const text = raw.trim();
  if (text.length < 10 || text.length > 2000) return null;
  let u: URL;
  try { u = new URL(text); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  if (YT_HOSTS.some((d) => hostIs(host, d))) return ytEmbed(u) ? { source: "youtube", url: u.toString() } : null;

  const book = parseBookLink(text); // host ki safai jaanch (IP, .local waghera band)
  if (!book) return null;

  if (book.source === "drive" || book.source === "mega") {
    return embedUrl(book.source, book.url) ? { source: book.source, url: book.url } : null; // folder link yahin rukta hai
  }
  if (DIRECT_EXT.test(u.pathname)) {
    if (book.source === "dropbox") { // Dropbox ka page nahi, seedhi file chahiye
      u.searchParams.delete("dl");
      u.searchParams.set("raw", "1");
    }
    return { source: "direct", url: u.toString() };
  }
  return null;
}

export type Player = { kind: "iframe"; src: string } | { kind: "video"; src: string };

// Database me rakhe (source, url) se player ka src banao. "upload" ke liye server signed URL deta hai.
export function playerFor(source: VideoSource, url: string | null): Player | null {
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (source === "youtube") {
    const src = ytEmbed(u);
    return src ? { kind: "iframe", src } : null;
  }
  if (source === "drive" || source === "mega") {
    const src = embedUrl(source, url);
    return src ? { kind: "iframe", src } : null;
  }
  if (source === "direct") return { kind: "video", src: url };
  return null;
}

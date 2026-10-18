import type { VideoType } from "./types";

export function parseVideoLink(
  url: string
): { type: VideoType; embed: string } {
  const trimmed = url.trim();
  if (!trimmed) return { type: "unknown", embed: "" };

  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/
  );
  if (ytMatch)
    return {
      type: "youtube",
      embed: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };

  if (trimmed.includes("drive.google.com")) {
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch)
      return {
        type: "drive",
        embed: `https://drive.google.com/file/d/${dMatch[1]}/preview`,
      };
    return {
      type: "drive",
      embed: trimmed.replace("/view", "/preview"),
    };
  }

  if (trimmed.includes("mega.nz")) return { type: "mega", embed: trimmed };

  if (trimmed.includes("vimeo.com")) {
    const vMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vMatch)
      return {
        type: "vimeo",
        embed: `https://player.vimeo.com/video/${vMatch[1]}`,
      };
    return { type: "vimeo", embed: trimmed };
  }

  if (
    trimmed.endsWith(".mp4") ||
    trimmed.endsWith(".webm") ||
    trimmed.endsWith(".m3u8")
  )
    return { type: "mp4", embed: trimmed };

  if (trimmed.startsWith("http")) return { type: "direct", embed: trimmed };

  return { type: "unknown", embed: trimmed };
}

export function typeLabel(type: VideoType): string {
  return (
    {
      youtube: "YOUTUBE",
      drive: "DRIVE",
      mega: "MEGA",
      vimeo: "VIMEO",
      mp4: "MP4",
      direct: "LINK",
      unknown: "FILE",
    }[type] || "VIDEO"
  );
}

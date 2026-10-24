import type { CSSProperties } from "react";
import { coverUrl } from "@/lib/book-meta";

// Book ka cover (3:4). Cover na ho to sunehri-hari placeholder dikhta hai.
export default function BookCover({ path, title, width = 72 }: { path?: string | null; title: string; width?: number }) {
  const src = coverUrl(path);
  const height = Math.round((width * 4) / 3);
  const box: CSSProperties = {
    width,
    height,
    flexShrink: 0,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.12)",
  };
  if (!src) {
    return (
      <div
        aria-hidden
        style={{
          ...box,
          display: "grid",
          placeItems: "center",
          fontSize: Math.round(width / 2.4),
          background: "linear-gradient(160deg, rgba(212,175,55,.25), rgba(16,80,50,.45))",
        }}
      >
        📘
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`${title} cover`} width={width} height={height} loading="lazy" style={{ ...box, objectFit: "cover" }} />;
}

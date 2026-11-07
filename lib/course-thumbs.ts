// Video card par kaunsi photo dikhani hai:
// 1) admin ne jo photo lagayi  2) YouTube ki apni thumbnail  3) kuch nahi (card par gradient dikhega)
import { coverUrl } from "@/lib/book-meta";
import { ytId } from "@/lib/video-links";

type V = { source: string; url: string | null; thumb_path?: string | null };

export function videoThumbUrl(v: V): string | null {
  const own = coverUrl(v.thumb_path);
  if (own) return own;
  if (v.source === "youtube" && v.url) {
    try {
      const id = ytId(new URL(v.url));
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    } catch { /* kharab link, photo nahi */ }
  }
  return null;
}

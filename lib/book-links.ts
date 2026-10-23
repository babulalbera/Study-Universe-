// Book ke external links (Drive, Mega, Dropbox, ...) ko jaanchna aur pehchanna.
// Server aur browser dono jagah chalta hai, isliye "server-only" nahi lagaya.
export type BookSource = "drive" | "mega" | "dropbox" | "onedrive" | "mediafire" | "telegram" | "other";

export const SOURCE_LABEL: Record<BookSource, string> = {
  drive: "Google Drive",
  mega: "Mega",
  dropbox: "Dropbox",
  onedrive: "OneDrive",
  mediafire: "MediaFire",
  telegram: "Telegram",
  other: "Link",
};

const HOSTS: [BookSource, string[]][] = [
  ["drive", ["drive.google.com", "docs.google.com", "drive.usercontent.google.com"]],
  ["mega", ["mega.nz", "mega.io", "mega.co.nz"]],
  ["dropbox", ["dropbox.com", "dropboxusercontent.com"]],
  ["onedrive", ["onedrive.live.com", "1drv.ms", "sharepoint.com"]],
  ["mediafire", ["mediafire.com"]],
  ["telegram", ["t.me", "telegram.me"]],
];

const hostIs = (h: string, d: string) => h === d || h.endsWith(`.${d}`);

export function parseBookLink(raw: string): { url: string; source: BookSource } | null {
  const text = raw.trim();
  if (text.length < 10 || text.length > 2000) return null;
  let u: URL;
  try { u = new URL(text); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!host.includes(".") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.endsWith(".local") || host.endsWith(".internal")) return null;
  const source = HOSTS.find(([, ds]) => ds.some((d) => hostIs(host, d)))?.[0] ?? "other";
  // u.toString() '#' wala hissa bhi rakhta hai (Mega ki key usi mein hoti hai)
  return { url: u.toString(), source };
}

// Link ko website ke andar (iframe mein) dikhane layak URL banao. Jo platform andar nahi khul sakta uske liye null.
export function embedUrl(source: BookSource, url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (source === "drive") {
    const id = u.pathname.match(/\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
    return id && !u.pathname.includes("/folders/") ? `https://drive.google.com/file/d/${id}/preview` : null;
  }
  if (source === "mega") {
    const m = u.pathname.match(/^\/file\/([\w-]+)/);
    if (m && u.hash.length > 1) return `https://mega.nz/embed/${m[1]}${u.hash}`;
    const old = u.hash.match(/^#!([\w-]+)!([\w-]+)/); // purana format: mega.nz/#!ID!KEY
    return old ? `https://mega.nz/embed/${old[1]}#${old[2]}` : null;
  }
  if (source === "dropbox") {
    u.searchParams.delete("dl");
    u.searchParams.set("raw", "1");
    return u.toString();
  }
  if (source === "other" && u.pathname.toLowerCase().endsWith(".pdf")) {
    return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
  }
  return null; // OneDrive, MediaFire, Telegram, folder links: andar nahi khulte
}

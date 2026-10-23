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

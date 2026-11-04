// Kaun se external link ko hum server se stream karke apne reader me dikha sakte hain.
// Sirf server par use hota hai (page.tsx aur file/route.ts).
import type { BookSource } from "@/lib/book-links";

export type ProxyTarget = { kind: "fetch"; url: string } | { kind: "mega"; url: string };

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function proxyTarget(source: BookSource, url: string): ProxyTarget | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  if (source === "drive") {
    const id = u.pathname.match(/\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
    if (!id || !/^[\w-]{10,}$/.test(id) || u.pathname.includes("/folders/")) return null;
    return { kind: "fetch", url: `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t` };
  }

  if (source === "dropbox") {
    const isFile = u.pathname.startsWith("/s/") || u.pathname.startsWith("/scl/fi/");
    if (!isFile) return null; // folder link
    u.searchParams.delete("raw");
    u.searchParams.set("dl", "1");
    return { kind: "fetch", url: u.toString() };
  }

  if (source === "onedrive") {
    const h = u.hostname.toLowerCase();
    if (h === "1drv.ms" || h.endsWith("onedrive.live.com")) {
      return { kind: "fetch", url: `https://api.onedrive.com/v1.0/shares/u!${b64url(url)}/root/content` };
    }
    return null;
  }

  if (source === "mega") {
    if (u.pathname.includes("/folder/") || u.hash.startsWith("#F!")) return null; // folder
    const newFmt = /^\/file\/[\w-]+/.test(u.pathname) && u.hash.length > 1;
    const oldFmt = /^#![\w-]+![\w-]+/.test(u.hash);
    return newFmt || oldFmt ? { kind: "mega", url } : null;
  }

  if (source === "other" && u.pathname.toLowerCase().endsWith(".pdf")) {
    return { kind: "fetch", url };
  }

  return null; // MediaFire, Telegram, SharePoint, folder links
}

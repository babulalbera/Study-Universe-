"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";

// Folder card ke upar: cover ke daayen-upar ❤ Favourite, neeche bayen ↗ Share.
// Favourite Folder list me sabse pehle aate hain. Favourite sirf isi phone/browser me save hota hai.
const KEY = "cv-fav-folders";
const EVT = "cv-fav-folders-change";

const read = (): string[] => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};
const write = (ids: string[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage band ho to chalta hai */ }
  window.dispatchEvent(new Event(EVT));
};

type Props = { courseId: string; folderId: string; title: string; index: number; children: ReactNode };

export default function FolderCardShell({ courseId, folderId, title, index, children }: Props) {
  const toast = useToast();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const sync = () => setFav(read().includes(folderId));
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [folderId]);

  const toggle = () => {
    const cur = read();
    const on = !cur.includes(folderId);
    write((on ? [...cur, folderId] : cur.filter((x) => x !== folderId)).slice(-200));
    toast(on ? "Favourite me jod diya ❤" : "Favourite se hata diya");
  };

  const share = async () => {
    const url = `${window.location.origin}/courses/${courseId}?folder=${folderId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copy ho gaya ✓");
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // user ne khud band kiya
      toast("Share nahi ho paya");
    }
  };

  const style = { order: fav ? -1 : index, "--i": index } as CSSProperties; // Favourite sabse upar

  return (
    <div className={`cvf-item${fav ? " fav" : ""}`} style={style}>
      {children}
      <button type="button" className={`cvf-fav${fav ? " on" : ""}`} onClick={toggle} aria-pressed={fav} aria-label={fav ? `${title}: Favourite se hatao` : `${title}: Favourite me jodo`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" />
        </svg>
      </button>
      <button type="button" className="cvf-share" onClick={() => void share()} aria-label={`${title}: Share karo`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
        </svg>
      </button>
    </div>
  );
}

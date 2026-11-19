"use client";
import { useEffect, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { toggleFolderFav } from "@/features/bookmarks/folder-actions";

// Folder card ke upar: cover ke daayen-upar ❤ Favourite (tumhare account me save, Profile > Favorites me dikhta hai), neeche bayen ↗ Share.
// Favourite Folder list me sabse pehle aate hain.
type Props = { courseId: string; folderId: string; title: string; index: number; initialSaved: boolean; children: ReactNode };

export default function FolderCardShell({ courseId, folderId, title, index, initialSaved, children }: Props) {
  const toast = useToast();
  const [fav, setFav] = useState(initialSaved);
  const [pending, start] = useTransition();
  useEffect(() => setFav(initialSaved), [initialSaved]);

  const toggle = () => {
    const next = !fav;
    setFav(next); // turant dikhao, fail hua to wapas
    start(async () => {
      const r = await toggleFolderFav(folderId);
      if (!r.ok) {
        setFav(!next);
        toast(r.error ?? "Kuch gadbad hui");
        return;
      }
      setFav(Boolean(r.saved));
      toast(r.saved ? "Favorites me jod diya ❤" : "Favorites se hata diya");
    });
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
      <button type="button" className={`cvf-fav${fav ? " on" : ""}`} onClick={toggle} disabled={pending} aria-pressed={fav} aria-label={fav ? `${title}: Favourite se hatao` : `${title}: Favourite me jodo`}>
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

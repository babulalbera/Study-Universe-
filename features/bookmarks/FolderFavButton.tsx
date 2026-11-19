"use client";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { toggleFolderFav } from "./folder-actions";
import "./bookmarks.css";

// Favorites page par Folder ke liye ❤ (BookmarkButton jaisa, bas Folder ke liye)
export default function FolderFavButton({ folderId, initialSaved }: { folderId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const toast = useToast();
  useEffect(() => setSaved(initialSaved), [initialSaved]);

  function click() {
    const next = !saved;
    setSaved(next); // turant dikhao, fail hua to wapas
    start(async () => {
      const r = await toggleFolderFav(folderId);
      if (!r.ok) { setSaved(!next); toast(r.error ?? "Kuch gadbad hui"); return; }
      setSaved(Boolean(r.saved));
      toast(r.saved ? "Favorites me jod diya ❤" : "Favorites se hata diya");
    });
  }

  return (
    <button type="button" className={`pr-fav${saved ? " on" : ""}`} onClick={click} disabled={pending}
      aria-pressed={saved} aria-label={saved ? "Favorites se hatao" : "Favorites me jodo"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" />
      </svg>
    </button>
  );
}

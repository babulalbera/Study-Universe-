"use client";
import { useEffect, useRef } from "react";

// Lambi Playlist me abhi chal raha video side-list me beech me dikhe (sirf jahan list khud scroll hoti hai)
export default function ActiveRowScroll() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const aside = ref.current?.closest("aside");
    const row = aside?.querySelector<HTMLElement>(".cv-row.on");
    if (!aside || !row || aside.scrollHeight <= aside.clientHeight + 4) return;
    aside.scrollTop = row.offsetTop - aside.clientHeight / 2 + row.clientHeight / 2;
  }, []);
  return <span ref={ref} hidden />;
}

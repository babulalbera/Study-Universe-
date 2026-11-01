"use client";
import { useEffect, type ReactNode } from "react";
import Portal from "./Portal";

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

export default function Modal({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Popup khula ho to peeche ka page scroll na ho
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <Portal>
      <div className="su-modal-bg" onClick={onClose}>
        <div className="su-modal glass" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
          <h3>{title}</h3>
          {children}
        </div>
      </div>
    </Portal>
  );
}

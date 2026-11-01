"use client";

export type ToastData = { id: number; msg: string; undo?: () => void };

// Neeche ka chhota message (kabhi kabhi "Undo" ke saath). Site ke Toast jaisa dikhta hai.
export default function TaskToast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="tb-toast">
      <span>{toast.msg}</span>
      {toast.undo && (
        <button type="button" onClick={() => { toast.undo?.(); onDone(); }}>Undo</button>
      )}
    </div>
  );
}

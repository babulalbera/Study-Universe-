"use client";

export type ToastData = { id: number; msg: string; undo?: () => void };

// Neeche ka chhota message (kabhi kabhi "Undo" ke saath). Site ke Toast jaisa dikhta hai.
export default function TaskToast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-[calc(104px+env(safe-area-inset-bottom))] left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-[color:var(--gold)] bg-[#111c13] px-4 py-2.5 text-[13px] text-[color:var(--gold3)]">
      <span>{toast.msg}</span>
      {toast.undo && (
        <button type="button" className="font-extrabold text-[color:var(--gold2)]" onClick={() => { toast.undo?.(); onDone(); }}>Undo</button>
      )}
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { PRIORITIES } from "@/features/tasks/model";
import { cn } from "@/lib/utils";

export type MenuAction = "edit" | "add" | "pending" | "reminder" | "remove" | `prio:${string}`;

// ⋮ dabane par khulne wala chhota menu: Edit, Add, Priority, Reminder, Remove (aur done ho to Mark Pending)
export default function TaskMenu({ done, priority, onAction, onClose }: { done: boolean; priority?: string; onAction: (a: MenuAction) => void; onClose: () => void }) {
  const [sub, setSub] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", down);
    document.addEventListener("touchstart", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("touchstart", down); document.removeEventListener("keydown", key); };
  }, [onClose]);

  const item = "block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-zinc-200 transition hover:bg-[color-mix(in_srgb,var(--gold)_14%,transparent)]";
  return (
    <div ref={ref} role="menu" className="absolute right-2 top-12 z-40 min-w-[190px] rounded-2xl border border-[color-mix(in_srgb,var(--gold)_35%,transparent)] bg-[#0b140d] p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
      {sub ? (
        PRIORITIES.map((p) => (
          <button key={p} type="button" role="menuitem" className={item} onClick={() => onAction(`prio:${p}`)}>
            {(priority || "medium") === p ? "✔ " : ""}{p[0].toUpperCase() + p.slice(1)}
          </button>
        ))
      ) : (
        <>
          <button type="button" role="menuitem" className={item} onClick={() => onAction("edit")}>✏️ Edit Task</button>
          <button type="button" role="menuitem" className={item} onClick={() => onAction("add")}>➕ Add Task</button>
          {done && <button type="button" role="menuitem" className={item} onClick={() => onAction("pending")}>↩️ Mark Pending</button>}
          <button type="button" role="menuitem" className={item} onClick={() => setSub(true)}>⚑ Priority</button>
          <button type="button" role="menuitem" className={item} onClick={() => onAction("reminder")}>⏰ Reminder</button>
          <button type="button" role="menuitem" className={cn(item, "text-red-400")} onClick={() => onAction("remove")}>🗑️ Remove Task</button>
        </>
      )}
    </div>
  );
}

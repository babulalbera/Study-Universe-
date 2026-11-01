"use client";
import { useEffect, useRef, useState } from "react";
import { PRIORITIES } from "@/features/tasks/model";
import { cn } from "@/lib/utils";
import { IconBell, IconCheck, IconEdit, IconFlag, IconPlus, IconTrash, IconUndo } from "./icons";

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

  return (
    <div ref={ref} role="menu" className="tb-menu">
      {sub ? (
        PRIORITIES.map((p) => (
          <button key={p} type="button" role="menuitemradio" aria-checked={(priority || "medium") === p} className="tb-mitem" onClick={() => onAction(`prio:${p}`)}>
            {(priority || "medium") === p ? <IconCheck /> : <IconFlag />}{p[0].toUpperCase() + p.slice(1)}
          </button>
        ))
      ) : (
        <>
          <button type="button" role="menuitem" className="tb-mitem" onClick={() => onAction("edit")}><IconEdit />Edit Task</button>
          <button type="button" role="menuitem" className="tb-mitem" onClick={() => onAction("add")}><IconPlus />Add Task</button>
          {done && <button type="button" role="menuitem" className="tb-mitem" onClick={() => onAction("pending")}><IconUndo />Mark Pending</button>}
          <button type="button" role="menuitem" className="tb-mitem" onClick={() => setSub(true)}><IconFlag />Priority</button>
          <button type="button" role="menuitem" className="tb-mitem" onClick={() => onAction("reminder")}><IconBell />Reminder</button>
          <button type="button" role="menuitem" className={cn("tb-mitem", "tb-mitem--danger")} onClick={() => onAction("remove")}><IconTrash />Remove Task</button>
        </>
      )}
    </div>
  );
}

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { fmt12, timeLeft, type Task } from "@/features/tasks/model";
import { IconBell, IconCheck, IconDots, IconFlag, IconHourglass, IconLock, IconNote, IconTarget, IconUndo, IconUnlock } from "./icons";
import TaskMenu, { type MenuAction } from "./TaskMenu";

type Props = {
  task: Task; no: number; idx: number; now: number; done: boolean; unlocked: boolean; dim: boolean;
  onToggle: (t: Task) => void; menuOpen: boolean; onMenu: (open: boolean) => void; onAction: (t: Task, a: MenuAction) => void;
};

const SAFE_COLOR = /^#[0-9a-f]{3,8}$/i;

// Ek task ka card. Upar: number • time • badge • menu. Neeche title, phir Complete / Lock wala hissa.
export default function TaskCard({ task: t, no, idx, now, done, unlocked, dim, onToggle, menuOpen, onMenu, onAction }: Props) {
  const live = now >= t.start && now < t.end && !done;
  const upcoming = now < t.start;
  const ended = now >= t.end && !done;
  const left = !done && !upcoming ? timeLeft(t.end, now) : null;
  const mins = Math.max(0, t.end - now);
  const pct = Math.min(100, Math.max(0, ((now - t.start) / (t.end - t.start)) * 100));
  const hot = t.priority && t.priority !== "medium" ? t.priority : "";
  const sub = [t.titleHi, t.duration].filter(Boolean).join(" • ");

  return (
    <article
      id={`task-${t.id}`}
      style={{ "--i": Math.min(idx, 12), ...(t.color && SAFE_COLOR.test(t.color) ? { boxShadow: `inset 4px 0 0 ${t.color}` } : {}) } as CSSProperties}
      className={cn("tb-card", done && "is-done", live && "is-live", dim && "is-dim", menuOpen && "is-open")}
    >
      {/* Upar: number • TASK KA NAAM • menu. Neeche: time, badge, tags ek line me, phir chhota note */}
      <div className="tb-head">
        <span className="tb-no" aria-label={`Task number ${no}`}>{no}</span>
        <h3 className="tb-title">{t.title}</h3>
        <button type="button" className="tb-iconbtn" aria-label={`Task ${no} menu`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => onMenu(!menuOpen)}>
          <IconDots />
        </button>
      </div>
      {menuOpen && <TaskMenu done={done} priority={t.priority} onClose={() => onMenu(false)} onAction={(a) => onAction(t, a)} />}

      <div className="tb-meta">
        <span className="tb-time">{t.timeLabel}</span>
        {live && <span className="tb-badge tb-badge--live">LIVE</span>}
        {done && <span className="tb-badge tb-badge--done">DONE</span>}
        {hot && <span className={cn("tb-pill", (hot === "high" || hot === "urgent") && "tb-pill--hot")}><IconFlag />{hot[0].toUpperCase() + hot.slice(1)}</span>}
        {t.description && <span className="tb-pill"><IconNote />Note</span>}
        {t.reminder && <span className="tb-pill"><IconBell />{t.reminder}</span>}
      </div>
      {sub && <p className="tb-sub">{sub}</p>}

      <div className="tb-foot">
        {done ? (
          <>
            <p className="tb-done-msg"><i><IconCheck /></i><span>Shabash! Target complete</span></p>
            <button type="button" onClick={() => onToggle(t)} className="tb-btn tb-btn--ghost"><IconUndo />Undo</button>
          </>
        ) : unlocked ? (
          <>
            <p className="tb-help"><IconUnlock /><span>{ended ? "Khatam • Ab tick karo" : `Unlocked • End: ${fmt12(t.end)}`}</span></p>
            <button type="button" onClick={() => onToggle(t)} className="tb-btn tb-btn--primary"><IconTarget />Complete Karo • Jai Hind!</button>
          </>
        ) : (
          <>
            <div className="tb-lock">
              <IconHourglass />
              <span>Abhi samay baaki hai</span>
              {left && <b>{left} baaki</b>}
            </div>
            <p className="tb-help">
              <IconLock />
              <span>{upcoming ? `Shuru: ${fmt12(t.start)} • End ke baad unlock hoga` : `End: ${fmt12(t.end)} • Khatam hone do, fir tick karna`}</span>
            </p>
            <button type="button" disabled className="tb-btn tb-btn--ghost"><IconLock />{mins > 0 ? `${mins} min baad khulega` : "Lock hai"}</button>
          </>
        )}
      </div>

      {live && (
        <div className="tb-progress" role="progressbar" aria-label="Task ka samay" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </div>
      )}
    </article>
  );
}

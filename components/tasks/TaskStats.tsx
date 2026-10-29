import { cn } from "@/lib/utils";
import { fmt12, type Filter } from "@/features/tasks/model";

type Props = {
  doneCount: number; total: number; streak: number; now: number;
  filter: Filter; onFilter: (f: Filter) => void; focus: boolean; onFocus: () => void;
};

const CHIPS: [Filter, string][] = [["all", "Sab"], ["pending", "Pending"], ["done", "Done"]];

// Upar ka box: kitne task complete, streak, abhi ka time, aur Sab / Pending / Done / Focus.
export default function TaskStats({ doneCount, total, streak, now, filter, onFilter, focus, onFocus }: Props) {
  const pct = Math.round((doneCount / Math.max(1, total)) * 100);
  return (
    <section className="glass space-y-4" aria-label="Aaj ke stats">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-[color-mix(in_srgb,var(--gold)_35%,transparent)] bg-black/30 px-3 py-1 text-[11px] font-black tracking-widest text-[color:var(--gold2)]">TODAY STATS • ROZ JEETO</span>
        <span aria-hidden="true">🔥</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
          <p className="text-[10px] font-black tracking-widest text-[color:var(--mute)]">COMPLETE</p>
          <p className="mt-1 text-[28px] font-black leading-none tabular-nums">{doneCount}<span className="text-[14px] font-semibold text-[color:var(--mute)]">/{total}</span></p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--gold3)] to-[color:var(--em)] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-zinc-300">
            <i className="h-1.5 w-1.5 rounded-full bg-[color:var(--em)]" />{fmt12(now)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
          <p className="text-[10px] font-black tracking-widest text-[color:var(--mute)]">STREAK • ROZ JEETO</p>
          <p className="mt-1 text-[28px] font-black leading-none tabular-nums">{streak} <span aria-hidden="true">🔥</span></p>
          <p className="mt-2.5 text-[11px] font-bold text-[color:var(--mint)]">Daily Win • Lagatar</p>
          <p className="mt-1 text-[11px] text-[color:var(--mute)]">{pct}% complete</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="su-chips" role="group" aria-label="Filter">
          {CHIPS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => onFilter(k)} aria-pressed={filter === k} className={cn("su-chip", filter === k && "on")}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={onFocus} aria-pressed={focus} className={cn("su-chip shrink-0 font-black tracking-wide", focus && "on")}>🎯 FOCUS</button>
      </div>
    </section>
  );
}

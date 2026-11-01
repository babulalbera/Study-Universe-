import { cn } from "@/lib/utils";
import { fmt12, type Filter } from "@/features/tasks/model";
import { IconFlame, IconTarget } from "./icons";

type Props = {
  doneCount: number; total: number; streak: number; now: number;
  filter: Filter; onFilter: (f: Filter) => void; focus: boolean; onFocus: () => void;
};

const CHIPS: [Filter, string][] = [["all", "Sab"], ["pending", "Pending"], ["done", "Done"]];

// Upar ka box: kitne task complete, streak, abhi ka time, aur Sab / Pending / Done / Focus.
export default function TaskStats({ doneCount, total, streak, now, filter, onFilter, focus, onFocus }: Props) {
  const pct = Math.round((doneCount / Math.max(1, total)) * 100);
  return (
    <section className="glass tb-stats" aria-label="Aaj ke stats">
      <div className="tb-tagrow">
        <span className="tb-tag">TODAY STATS • ROZ JEETO</span>
        <IconFlame />
      </div>

      <div className="tb-statgrid">
        <div className="tb-stat">
          <p className="tb-stat-k">Complete</p>
          <p className="tb-stat-v">{doneCount}<small>/{total}</small></p>
          <div className="tb-track" role="progressbar" aria-label="Aaj ka progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="tb-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="tb-clock"><i aria-hidden="true" />{fmt12(now)}</p>
        </div>
        <div className="tb-stat">
          <p className="tb-stat-k">Streak • Roz Jeeto</p>
          <p className="tb-stat-v">{streak}<IconFlame /></p>
          <p className="tb-stat-note">Daily Win • Lagatar</p>
          <p className="tb-stat-note">{pct}% complete</p>
        </div>
      </div>

      <div className="tb-filters">
        <div className="tb-chips" role="group" aria-label="Filter">
          {CHIPS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => onFilter(k)} aria-pressed={filter === k} className="tb-chip">{label}</button>
          ))}
        </div>
        <button type="button" onClick={onFocus} aria-pressed={focus} className={cn("tb-chip")}><IconTarget />FOCUS</button>
      </div>
    </section>
  );
}

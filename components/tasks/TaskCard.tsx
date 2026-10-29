import { cn } from "@/lib/utils";
import { fmt12, timeLeft, type Task } from "@/features/tasks/model";

type Props = { task: Task; no: number; now: number; done: boolean; unlocked: boolean; dim: boolean; onToggle: (t: Task) => void };

const SAFE_COLOR = /^#[0-9a-f]{3,8}$/i;

// Ek task ka card. Left me number (1, 2, 3...), phir time, naam aur neeche Complete / Lock wala hissa.
export default function TaskCard({ task: t, no, now, done, unlocked, dim, onToggle }: Props) {
  const live = now >= t.start && now < t.end && !done;
  const upcoming = now < t.start;
  const ended = now >= t.end && !done;
  const left = !done && !upcoming ? timeLeft(t.end, now) : null;
  const mins = Math.max(0, t.end - now);
  const pct = Math.min(100, Math.max(0, ((now - t.start) / (t.end - t.start)) * 100));
  const extra = [
    t.priority && t.priority !== "medium" ? t.priority.toUpperCase() : "",
    t.description ? "📝" : "",
    t.reminder ? `⏰${t.reminder}` : "",
  ].filter(Boolean);

  return (
    <article
      id={`task-${t.id}`}
      style={t.color && SAFE_COLOR.test(t.color) ? { boxShadow: `inset 4px 0 0 ${t.color}` } : undefined}
      className={cn(
        "relative rounded-2xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5",
        done
          ? "border-[color-mix(in_srgb,var(--em)_40%,transparent)] bg-[color-mix(in_srgb,var(--em)_7%,transparent)] shadow-[0_10px_30px_color-mix(in_srgb,var(--em)_14%,transparent)]"
          : live
            ? "border-orange-500/45 bg-orange-500/[0.05] shadow-[0_10px_28px_rgba(255,107,0,0.14)]"
            : "border-white/[0.09] bg-white/[0.04] hover:border-[color-mix(in_srgb,var(--gold)_35%,transparent)]",
        dim && "opacity-40 blur-[0.5px]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-label={`Task number ${no}`}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[13px] font-black tabular-nums",
            done
              ? "border-[color:var(--em)] bg-[color:var(--em)] text-black"
              : live
                ? "animate-pulse border-orange-300 bg-orange-500 text-black"
                : "border-white/15 bg-black/40 text-[color:var(--gold3)]",
          )}
        >
          {no}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10.5px] font-bold text-zinc-400">{t.timeLabel}</span>
            {live && <span className="animate-pulse rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-black">LIVE</span>}
            {done && <span className="rounded-full bg-[color:var(--em)] px-2 py-0.5 text-[10px] font-black text-black">DONE</span>}
          </div>
          <h3 className={cn("mt-1.5 text-[14px] font-extrabold leading-tight tracking-tight", done ? "text-[color:var(--mint)]" : "text-[color:var(--gold3)]")}>{t.title}</h3>
          <p className="mt-0.5 text-[11.5px] font-medium text-[color:var(--mute)]">{[t.titleHi, t.duration, ...extra].join(" • ")}</p>
        </div>
      </div>

      <div className="mt-3.5 min-h-[74px]">
        {done ? (
          <div className="space-y-2.5">
            <p className="flex items-center gap-2 text-[12px] font-bold text-[color:var(--mint)]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--em)] text-[11px] text-black">✓</span>
              Shabash! Target complete 🎯
            </p>
            <button type="button" onClick={() => onToggle(t)} className="su-btn su-btn-ghost !h-9 w-full !text-[12px]">↩️ Undo</button>
          </div>
        ) : unlocked ? (
          <div className="space-y-2.5">
            <p className="text-[11px] font-medium text-[color:var(--mute)]">{ended ? "🔓 Khatam • Ab tick karo" : `🔓 Unlocked • End: ${fmt12(t.end)}`}</p>
            <button type="button" onClick={() => onToggle(t)} className="su-btn su-btn-primary w-full !text-[13px] font-black">🎯 Complete Karo • Jai Hind!</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3">
              <span aria-hidden="true">🔒</span>
              <span className="text-[11px] font-bold text-zinc-400">⏳ Abhi samay baaki hai</span>
              {left && <span className="ml-auto font-mono text-[11px] font-bold text-amber-200/90">{left} baaki</span>}
            </div>
            <p className="line-clamp-2 px-1 text-[11px] font-medium leading-snug text-zinc-500">
              {upcoming ? `Shuru: ${fmt12(t.start)} • End ke baad unlock hoga` : `End: ${fmt12(t.end)} • Khatam hone do, fir tick karna`}
            </p>
            <button type="button" disabled className="su-btn su-btn-ghost !h-9 w-full !text-[12px]">🔒 {mins > 0 ? `${mins} min baad khulega` : "Lock hai"}</button>
          </div>
        )}
      </div>

      {live && (
        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[color:var(--em)] transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      )}
    </article>
  );
}

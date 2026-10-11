"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicQuestion } from "./types";
import { cn, formatDuration } from "@/lib/utils";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { submitAttempt } from "./actions";

type Props = { attemptId: string; title: string; questions: PublicQuestion[]; remainingSeconds: number };

export default function TestRunner({ attemptId, title, questions, remainingSeconds }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [review, setReview] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(remainingSeconds);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const sent = useRef(false);

  const submit = useCallback(async () => {
    if (sent.current) return;
    sent.current = true;
    setBusy(true);
    const res = await submitAttempt(attemptId, answers); // safal hone par redirect ho jata hai
    if (res?.error) { setErr(res.error); setBusy(false); sent.current = false; }
  }, [attemptId, answers]);

  useEffect(() => {
    if (left <= 0) { void submit(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, submit]);

  const q = questions[idx];
  const attempted = Object.keys(answers).length;

  return (
    <div className="su-list">
      <div className="glass" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <b style={{ minWidth: 0 }}>{title}</b>
        <span style={{ color: left < 60 ? "#fca5a5" : "var(--gold2)", fontWeight: 700 }}>⏱ {formatDuration(left)}</span>
      </div>

      <div className="glass">
        <p className="su-muted">सवाल {idx + 1} / {questions.length} • {q.marks} अंक</p>
        <h3 style={{ margin: "6px 0 14px", fontSize: 18, fontFamily: "var(--dev)" }}>{q.question_text}</h3>
        <div className="su-list">
          {q.options.map((o, i) => (
            <button key={i} type="button" className={cn("su-opt", answers[q.id] === i && "on")} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}>
              <b>{String.fromCharCode(65 + i)}.</b> {o}
            </button>
          ))}
        </div>
        <div className="su-row">
          <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← पिछला</Button>
          <Button variant="ghost" onClick={() => setReview((r) => ({ ...r, [q.id]: !r[q.id] }))}>{review[q.id] ? "Review हटाओ" : "Review के लिए"}</Button>
          <Button variant="ghost" onClick={() => setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; })}>Clear</Button>
          <Button disabled={idx === questions.length - 1} onClick={() => setIdx(idx + 1)}>अगला →</Button>
        </div>
      </div>

      <div className="glass">
        <div className="su-pal">
          {questions.map((x, i) => (
            <button key={x.id} aria-label={`सवाल ${i + 1}`} className={cn(answers[x.id] !== undefined && "ans", review[x.id] && "rev", i === idx && "cur")} onClick={() => setIdx(i)}>{i + 1}</button>
          ))}
        </div>
        {err && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5", marginTop: 10 }}>{err}</p>}
        <div className="su-row"><Button disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Submit हो रहा है…" : "Test Submit करो"}</Button></div>
      </div>

      <ConfirmDialog open={confirm} title="Submit करना है?" text={`${attempted}/${questions.length} सवाल attempt हुए हैं। Submit के बाद बदल नहीं सकते।`}
        onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); void submit(); }} />
    </div>
  );
}

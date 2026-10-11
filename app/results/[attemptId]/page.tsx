import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { getAttempt, getAttemptReview } from "@/features/results/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Test Result" };

export default async function AttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) notFound();
  const rows = await getAttemptReview(attemptId);
  const right = rows.filter((r) => r.is_correct === true).length;
  const wrong = rows.filter((r) => r.is_correct === false).length;
  const skipped = rows.length - right - wrong;

  return (
    <>
      <PageHeader title={`🏁 ${attempt.mock_tests?.title ?? "Test"}`} subtitle="तुम्हारा Result और सही उत्तर" />
      <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        <div className="glass su-stat"><b>{attempt.score ?? 0}/{attempt.mock_tests?.total_marks ?? 0}</b><span>अंक</span></div>
        <div className="glass su-stat"><b>{right} ✓ {wrong} ✗ {skipped} –</b><span>सही • गलत • छोड़े</span></div>
      </div>

      {rows.map((r, i) => (
        <section key={r.question_id} className="glass">
          <p className="su-muted">सवाल {i + 1} • {r.marks} अंक</p>
          <h3 style={{ margin: "6px 0 12px", fontSize: 17, fontFamily: "var(--dev)" }}>{r.question_text}</h3>
          <div className="su-list">
            {r.options.map((o, k) => (
              <div key={k} className={cn("su-opt", k === r.correct_index && "good", r.selected_index === k && k !== r.correct_index && "bad")}>
                <b>{String.fromCharCode(65 + k)}.</b> {o}
                {k === r.correct_index && " ✓"}
                {r.selected_index === k && k !== r.correct_index && " (तुम्हारा उत्तर)"}
              </div>
            ))}
          </div>
          {r.selected_index === null && <p className="su-muted" style={{ marginTop: 8 }}>यह सवाल छोड़ा था।</p>}
          {r.explanation && <p className="su-muted" style={{ marginTop: 8, fontFamily: "var(--dev)" }}>💡 {r.explanation}</p>}
        </section>
      ))}
      <div className="su-row"><Button href="/results" variant="ghost">← सभी Results</Button><Button href="/mock-tests">और Tests</Button></div>
    </>
  );
}

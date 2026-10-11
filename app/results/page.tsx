import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Sidebar from "@/components/layout/Sidebar";
import { getMyAttempts } from "@/features/results/queries";

export const metadata: Metadata = { title: "Results & Progress" };

export default async function ResultsPage() {
  const attempts = await getMyAttempts();
  const pcts = attempts.map((a) => (a.mock_tests && a.mock_tests.total_marks > 0 ? ((a.score ?? 0) / a.mock_tests.total_marks) * 100 : 0));
  const best = pcts.length ? Math.max(...pcts) : 0;
  const avg = pcts.length ? pcts.reduce((x, y) => x + y, 0) / pcts.length : 0;

  return (
    <>
      <PageHeader title="📊 Results & Progress" subtitle="अपने Test के Score और तरक्की देखो।" />
      <div className="adm" style={{ marginTop: 0 }}>
        <Sidebar />
        {attempts.length === 0 ? (
          <EmptyState icon="📈" title="अभी कोई Result नहीं है" text="पहला Mock Test दो, फिर Score और Progress यहाँ दिखेगी."
            action={<Button href="/mock-tests">Test शुरू करें</Button>} />
        ) : (
          <div className="grid gap-3 content-start min-w-0">
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <div className="glass su-stat"><b>{attempts.length}</b><span>Tests दिए</span></div>
              <div className="glass su-stat"><b>{best.toFixed(0)}%</b><span>सबसे अच्छा</span></div>
              <div className="glass su-stat"><b>{avg.toFixed(0)}%</b><span>औसत</span></div>
            </div>
            <div className="su-list">
              {attempts.map((a, i) => (
                <Link key={a.id} href={`/results/${a.id}`} className="su-item">
                  <div style={{ minWidth: 0 }}>
                    <h3>{a.mock_tests?.title ?? "Test"}</h3>
                    <p>{a.submitted_at ? new Date(a.submitted_at).toLocaleString("hi-IN") : ""}</p>
                  </div>
                  <b style={{ color: "var(--gold2)", whiteSpace: "nowrap" }}>{a.score ?? 0}/{a.mock_tests?.total_marks ?? 0} • {pcts[i].toFixed(0)}%</b>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import TestRunner from "@/features/tests/TestRunner";
import { getOpenAttempt, getTest, getTestQuestions } from "@/features/tests/queries";
import { startTest } from "@/features/tests/actions";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Test दीजिए" };

export default async function TestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/mock-tests/${testId}`)}`);

  const test = await getTest(testId);
  if (!test) notFound();
  const attempt = await getOpenAttempt(testId, test.duration_minutes);

  if (!attempt) {
    return (
      <>
        <PageHeader title={`⏱️ ${test.title}`} subtitle={[test.category, `${test.duration_minutes} मिनट`, `${test.total_marks} अंक`].filter(Boolean).join(" • ")} />
        <section className="glass grid gap-3">
          {test.description && <p className="su-muted">{test.description}</p>}
          <p className="su-muted">Start दबाते ही Timer चालू हो जाएगा और बंद नहीं होगा। बीच में Page छोड़ दो तो भी समय चलता रहेगा।</p>
          <form action={startTest}>
            <input type="hidden" name="test_id" value={test.id} />
            <button type="submit" className="pbtn pbtn-gold">▶️ Test शुरू करो</button>
          </form>
        </section>
      </>
    );
  }

  const questions = await getTestQuestions(testId);
  if (questions.length === 0) {
    return <EmptyState icon="🚧" title="इस Test में अभी सवाल नहीं हैं" action={<Button href="/mock-tests" variant="ghost">← सभी Tests</Button>} />;
  }
  return <TestRunner attemptId={attempt.id} title={test.title} questions={questions} remainingSeconds={attempt.remainingSeconds} />;
}

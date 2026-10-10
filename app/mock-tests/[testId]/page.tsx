import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export const metadata: Metadata = { title: "Test दीजिए" };

export default async function TestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  return (
    <>
      <PageHeader title="⏱️ Test" subtitle={`Test ID: ${testId}`} />
      <EmptyState
        icon="🔒"
        title="यह Test अभी उपलब्ध नहीं है"
        text="Test, Questions और Timer Phase 4 में जुड़ेंगे। सही उत्तर कभी Browser को नहीं भेजे जाएँगे – Scoring Server पर होगी।"
        action={<Button href="/mock-tests" variant="ghost">← सभी Tests</Button>}
      />
    </>
  );
}

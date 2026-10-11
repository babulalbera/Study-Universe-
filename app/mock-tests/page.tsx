import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { getPublishedTests } from "@/features/tests/queries";

export const metadata: Metadata = { title: "Mock Tests" };

export default async function MockTestsPage() {
  const tests = await getPublishedTests();
  return (
    <>
      <PageHeader title="📝 Mock Tests" subtitle="असली Exam Pattern पर Practice करो।" />
      {tests.length === 0 ? (
        <EmptyState icon="🧪" title="अभी कोई Mock Test नहीं है" text="Admin Panel से Test बनते ही परीक्षा के हिसाब से यहाँ दिखेंगे।" />
      ) : (
        <div className="su-list">
          {tests.map((t) => (
            <Link key={t.id} href={`/mock-tests/${t.id}`} className="su-item">
              <div style={{ minWidth: 0 }}>
                <h3>{t.title}</h3>
                <p>{[t.category, `${t.duration_minutes} मिनट`, `${t.total_marks} अंक`].filter(Boolean).join(" • ")}</p>
              </div>
              <span className="su-btn su-btn-primary">शुरू →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

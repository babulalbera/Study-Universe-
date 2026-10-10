import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Mock Tests" };

export default function MockTestsPage() {
  return (
    <>
      <PageHeader title="📝 Mock Tests" subtitle="असली Exam Pattern पर Practice करो।" />
      <EmptyState
        icon="🧪"
        title="अभी कोई Mock Test नहीं है"
        text="Admin Panel से Test बनते ही परीक्षा के हिसाब से यहाँ दिखेंगे।"
      />
    </>
  );
}

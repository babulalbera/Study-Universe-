import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Daily Tasks" };

export default function TasksPage() {
  return (
    <>
      <PageHeader title="✅ Daily Tasks" subtitle="रोज़ के Task पूरे करो, Streak बनाओ।" />
      <EmptyState
        icon="🗒️"
        title="अभी कोई Task नहीं है"
        text="Admin Panel से Task जुड़ते ही यहाँ दिखेंगे। Login करके Complete मार्क कर पाओगे।"
      />
    </>
  );
}

import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Books & PDFs" };

export default function BooksPage() {
  return (
    <>
      <PageHeader title="📚 Books & PDFs" subtitle="Category चुनो, PDF पढ़ो या Download करो।" />
      <EmptyState
        icon="📖"
        title="अभी कोई Book/PDF नहीं है"
        text="Admin Panel से PDF Upload होते ही Category के हिसाब से यहाँ दिखेंगी।"
      />
    </>
  );
}

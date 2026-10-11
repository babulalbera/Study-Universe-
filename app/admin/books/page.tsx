import AdminHeader from "@/components/admin/AdminHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminBooksPage() {
  return (
    <>
      <AdminHeader title="📚 Books & PDF" subtitle="PDF Upload और Categories" />
      <EmptyState icon="🛠️" title="यह Section Phase 4 में चालू होगा" text="Public Page के साथ यह Section Phase 4 में बनेगा।" />
    </>
  );
}

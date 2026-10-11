import AdminHeader from "@/components/admin/AdminHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminTestsPage() {
  return (
    <>
      <AdminHeader title="📝 Mock Tests" subtitle="Tests, Questions, Options, सही उत्तर और Marks" />
      <EmptyState icon="🛠️" title="यह Section Phase 4 में चालू होगा" text="Public Page के साथ यह Section Phase 4 में बनेगा।" />
    </>
  );
}

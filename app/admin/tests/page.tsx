import AdminHeader from "@/components/admin/AdminHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminTestsPage() {
  return (
    <>
      <AdminHeader title="📝 Mock Tests" subtitle="Tests, Questions, Options, सही उत्तर और Marks" />
      <EmptyState icon="🛠️" title="यह Section Phase 3-4 में चालू होगा" text="Database (Phase 2) जुड़ने के बाद यहाँ जोड़ना, बदलना और हटाना चालू होगा।" />
    </>
  );
}

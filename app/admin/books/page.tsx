import AdminHeader from "@/components/admin/AdminHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminBooksPage() {
  return (
    <>
      <AdminHeader title="📚 Books & PDF" subtitle="PDF Upload और Categories" />
      <EmptyState icon="🛠️" title="यह Section Phase 3-4 में चालू होगा" text="Database (Phase 2) जुड़ने के बाद यहाँ जोड़ना, बदलना और हटाना चालू होगा।" />
    </>
  );
}

import AdminHeader from "@/components/admin/AdminHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminAnnouncementsPage() {
  return (
    <>
      <AdminHeader title="📢 Announcements" subtitle="Notices और Announcements" />
      <EmptyState icon="🛠️" title="यह Section Phase 3-4 में चालू होगा" text="Database (Phase 2) जुड़ने के बाद यहाँ जोड़ना, बदलना और हटाना चालू होगा।" />
    </>
  );
}

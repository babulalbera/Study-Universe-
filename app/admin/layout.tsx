import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getUser, requireAdmin } from "@/lib/auth";

// Asli suraksha: Server par database ke role se jaanch. Admin nahi to 404.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  await requireAdmin();
  return (
    <div className="adm">
      <AdminSidebar />
      <div className="grid gap-4 content-start min-w-0">{children}</div>
    </div>
  );
}

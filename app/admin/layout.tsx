import { notFound } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

/**
 * ⚠️ अस्थायी सुरक्षा (Phase 1): Admin अभी सिर्फ़ आपके कंप्यूटर (npm run dev) पर खुलता है।
 * Live Site पर 404 आएगा। Phase 3 में असली Admin-Role जाँच (Server पर) लगेगी
 * और तब यह लाइन हटेगी।
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="adm">
      <AdminSidebar />
      <div className="grid gap-4 content-start min-w-0">{children}</div>
    </div>
  );
}

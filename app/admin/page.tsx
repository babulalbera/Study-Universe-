import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { ADMIN_LINKS } from "@/components/admin/AdminSidebar";

export default function AdminDashboard() {
  return (
    <>
      <AdminHeader title="Admin Dashboard" subtitle="यहाँ से पूरी Website का Content बिना Code बदले मैनेज होगा।" />
      <div className="grid">
        {ADMIN_LINKS.filter((l) => l.href !== "/admin").map((l) => (
          <Link key={l.href} href={l.href} className="glass block">
            <b style={{ fontFamily: "var(--head)" }}>{l.label}</b>
            <p className="text-[12.5px] text-[color:var(--mute)] mt-1" style={{ fontFamily: "var(--dev)" }}>{l.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

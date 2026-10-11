import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import Flash from "@/components/admin/Flash";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { setRole } from "@/features/admin/actions";
import type { Profile } from "@/types/database";

const PER_PAGE = 50;
type Row = { id: string; email: string; name: string; role: string; joined: string };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; page?: string }> }) {
  const me = await requireAdmin();
  const { ok, error, page } = await searchParams;
  const pageNo = Math.max(1, Number(page) || 1);

  let rows: Row[] = [];
  let note = "";
  let hasMore = false;
  try {
    // Email auth system mein rehta hai, isliye service key (sirf server par, admin jaanch ke baad)
    const admin = createAdminClient();
    const { data: list, error: lerr } = await admin.auth.admin.listUsers({ page: pageNo, perPage: PER_PAGE });
    if (lerr) throw lerr;
    const users = list.users;
    hasMore = users.length === PER_PAGE;
    const supabase = await createClient();
    const { data: pd } = await supabase.from("profiles").select("*").in("id", users.map((u) => u.id));
    const byId = new Map(((pd ?? []) as Profile[]).map((p) => [p.id, p]));
    rows = users.map((u) => ({
      id: u.id, email: u.email ?? "", name: byId.get(u.id)?.full_name ?? "", role: byId.get(u.id)?.role ?? "student",
      joined: new Date(u.created_at).toLocaleDateString("hi-IN"),
    }));
  } catch {
    note = "Email सूची के लिए SUPABASE_SERVICE_ROLE_KEY चाहिए। अभी सिर्फ़ Profiles दिख रही हैं।";
    const supabase = await createClient();
    const { data: pd } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(PER_PAGE);
    rows = ((pd ?? []) as Profile[]).map((p) => ({ id: p.id, email: "—", name: p.full_name, role: p.role, joined: new Date(p.created_at).toLocaleDateString("hi-IN") }));
  }

  return (
    <>
      <AdminHeader title="👥 Users" subtitle="Users और उनके Roles" />
      <Flash ok={ok} error={error} />
      {note && <p className="su-muted">{note}</p>}
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyMessage="अभी कोई User नहीं है।"
        columns={[
          { key: "name", header: "नाम", render: (r) => r.name || "—" },
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "joined", header: "जुड़ा", render: (r) => r.joined },
          {
            key: "role", header: "Role",
            render: (r) =>
              r.id === me.id ? (
                <span className="adm-tag">{r.role} (आप)</span>
              ) : (
                <form action={setRole} className="flex gap-2 items-center">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="role" defaultValue={r.role} style={{ height: 36, borderRadius: 10, background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}>
                    <option value="student">student</option>
                    <option value="admin">admin</option>
                  </select>
                  <button type="submit" className="pbtn pbtn-ghost" style={{ height: 36 }}>Save</button>
                </form>
              ),
          },
        ]}
      />
      <div className="su-row">
        {pageNo > 1 && <Link className="pbtn pbtn-ghost" href={`/admin/users?page=${pageNo - 1}`}>← पिछला</Link>}
        {hasMore && <Link className="pbtn pbtn-ghost" href={`/admin/users?page=${pageNo + 1}`}>अगला →</Link>}
      </div>
    </>
  );
}

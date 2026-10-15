import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import DeleteButton from "@/components/admin/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { deleteReport } from "@/features/admin/content-actions";

const CAT: Record<string, string> = { bug: "Bug", content: "Content", account: "Account", other: "Anya" };
type Row = { id: string; category: string; message: string; created_at: string; profiles: { full_name: string } | null };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("support_reports").select("id,category,message,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <AdminHeader title="🛟 Reports" subtitle="Users ki bheji hui samasyayein" />
      <Flash ok={ok} error={error} />
      {rows.length === 0 && <p className="su-muted">Abhi koi Report nahi.</p>}
      {rows.map((r) => (
        <details key={r.id} className="adm-d">
          <summary><span>{r.profiles?.full_name || "User"} • {CAT[r.category] ?? r.category}</span><span className="adm-tag">{new Date(r.created_at).toLocaleDateString("hi-IN")}</span></summary>
          <p className="su-muted" style={{ whiteSpace: "pre-wrap" }}>{r.message}</p>
          <form action={deleteReport} className="su-row"><input type="hidden" name="id" value={r.id} /><DeleteButton label="Report hatao" /></form>
        </details>
      ))}
    </>
  );
}

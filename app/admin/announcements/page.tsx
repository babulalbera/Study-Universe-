import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveAnnouncement, deleteAnnouncement } from "@/features/admin/actions";
import type { Announcement } from "@/types/database";

function Fields({ a }: { a?: Announcement }) {
  return (
    <div className="grid gap-3">
      {a && <input type="hidden" name="id" value={a.id} />}
      <Field label="Title" name="title" defaultValue={a?.title} required />
      <Field label="विवरण (ज़रूरी नहीं)" name="body" rows={3} defaultValue={a?.body} />
      <label className="adm-chk"><input type="checkbox" name="is_active" defaultChecked={a ? a.is_active : true} /> Home पर दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

export default async function AdminAnnouncementsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50);
  const items = (data ?? []) as Announcement[];
  return (
    <>
      <AdminHeader title="📢 Announcements" subtitle="Home Page पर दिखने वाली सूचनाएँ" />
      <Flash ok={ok} error={error} />
      <details className="adm-d"><summary>➕ नई सूचना</summary><form action={saveAnnouncement}><Fields /></form></details>
      {items.length === 0 && <p className="su-muted">अभी कोई सूचना नहीं है।</p>}
      {items.map((a) => (
        <details key={a.id} className="adm-d">
          <summary><span>{a.title}</span><span className={`adm-tag ${a.is_active ? "" : "off"}`}>{a.is_active ? "चालू" : "बंद"}</span></summary>
          <form action={saveAnnouncement}><Fields a={a} /></form>
          <form action={deleteAnnouncement} className="su-row"><input type="hidden" name="id" value={a.id} /><DeleteButton /></form>
        </details>
      ))}
    </>
  );
}

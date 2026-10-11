import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveTask, deleteTask } from "@/features/admin/actions";
import type { Task } from "@/types/database";

function Fields({ t }: { t?: Task }) {
  return (
    <div className="grid gap-3">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Task" name="title" defaultValue={t?.title} required />
      <Field label="Subject (जैसे Maths, English)" name="subject" defaultValue={t?.subject} />
      <Field label="Note / Shortcut" name="note" rows={2} defaultValue={t?.note} />
      <Field label="आख़िरी तारीख (ज़रूरी नहीं)" name="due_date" type="date" defaultValue={t?.due_date ?? ""} />
      <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={t?.sort_order ?? 0} />
      <label className="adm-chk"><input type="checkbox" name="is_active" defaultChecked={t ? t.is_active : true} /> Students को दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

export default async function AdminTasksPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").order("sort_order").order("created_at", { ascending: false }).limit(100);
  const tasks = (data ?? []) as Task[];
  return (
    <>
      <AdminHeader title="✅ Tasks" subtitle="नोट: Public /tasks पेज अब हर User के अपने Tasks दिखाता है, ये सूची वहाँ नहीं दिखती" />
      <Flash ok={ok} error={error} />
      <details className="adm-d"><summary>➕ नया Task</summary><form action={saveTask}><Fields /></form></details>
      {tasks.length === 0 && <p className="su-muted">अभी कोई Task नहीं है।</p>}
      {tasks.map((t) => (
        <details key={t.id} className="adm-d">
          <summary><span>{t.title}</span><span className={`adm-tag ${t.is_active ? "" : "off"}`}>{t.is_active ? "चालू" : "बंद"}</span></summary>
          <form action={saveTask}><Fields t={t} /></form>
          <form action={deleteTask} className="su-row"><input type="hidden" name="id" value={t.id} /><DeleteButton /></form>
        </details>
      ))}
    </>
  );
}

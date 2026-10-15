import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveCourse, deleteCourse } from "@/features/admin/content-actions";
import type { Course } from "@/types/database";

function Fields({ c }: { c?: Course }) {
  return (
    <div className="grid gap-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Course का नाम" name="title" defaultValue={c?.title} required />
      <Field label="Category (जैसे SSC CGL, Army)" name="category" defaultValue={c?.category} />
      <Field label="छोटा विवरण" name="description" rows={3} defaultValue={c?.description} />
      <Field label="Link (YouTube / Website: https://...)" name="url" defaultValue={c?.url ?? ""} placeholder="https://..." />
      <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={c?.sort_order ?? 0} />
      <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={c ? c.is_published : true} /> Students को दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").order("sort_order").order("created_at", { ascending: false }).limit(100);
  const courses = (data ?? []) as Course[];
  return (
    <>
      <AdminHeader title="🎓 Courses" subtitle="Courses जोड़ना, बदलना और हटाना" />
      <Flash ok={ok} error={error} />
      <details className="adm-d" open={courses.length === 0}><summary>➕ नया Course</summary><form action={saveCourse}><Fields /></form></details>
      {courses.map((c) => (
        <details key={c.id} className="adm-d">
          <summary><span>{c.title}</span><span className={`adm-tag ${c.is_published ? "" : "off"}`}>{c.is_published ? "दिख रहा" : "छिपा"}</span></summary>
          <form action={saveCourse}><Fields c={c} /></form>
          <form action={deleteCourse} className="su-row"><input type="hidden" name="id" value={c.id} /><DeleteButton /></form>
        </details>
      ))}
    </>
  );
}

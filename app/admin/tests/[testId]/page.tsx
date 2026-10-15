import Link from "next/link";
import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveTest, deleteTest, saveQuestion, deleteQuestion } from "@/features/admin/content-actions";
import type { MockTest, Question } from "@/types/database";

const CORRECT = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `Option ${n}` }));

function QuestionFields({ testId, q, next }: { testId: string; q?: Question; next: number }) {
  const o = q?.options ?? [];
  return (
    <div className="grid gap-3">
      <input type="hidden" name="test_id" value={testId} />
      {q && <input type="hidden" name="id" value={q.id} />}
      <Field label="सवाल" name="question_text" rows={3} defaultValue={q?.question_text} required />
      <Field label="Option 1" name="opt1" defaultValue={o[0]} required />
      <Field label="Option 2" name="opt2" defaultValue={o[1]} required />
      <Field label="Option 3 (ज़रूरी नहीं)" name="opt3" defaultValue={o[2]} />
      <Field label="Option 4 (ज़रूरी नहीं)" name="opt4" defaultValue={o[3]} />
      <Field label="विषय (Subject) — Profile के विषय-वार Result के लिए" name="subject" defaultValue={q?.subject ?? ""} placeholder="Maths / English / GS..." />
      <Field label="सही उत्तर" name="correct" defaultValue={String((q?.correct_index ?? 0) + 1)} options={CORRECT} />
      <Field label="सही पर अंक" name="marks" type="number" defaultValue={q?.marks ?? 1} />
      <Field label="गलत पर कटेंगे (Negative)" name="negative_marks" type="number" defaultValue={q?.negative_marks ?? 0} />
      <Field label="समझाइश / Explanation (ज़रूरी नहीं)" name="explanation" rows={2} defaultValue={q?.explanation} />
      <Field label="क्रम" name="sort_order" type="number" defaultValue={q?.sort_order ?? next} />
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

export default async function AdminTestDetail({ params, searchParams }: { params: Promise<{ testId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { testId } = await params;
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: td }, { data: qd }, { data: cd }] = await Promise.all([
    supabase.from("mock_tests").select("*").eq("id", testId).maybeSingle(),
    supabase.from("questions").select("*").eq("test_id", testId).order("sort_order").order("created_at"),
    supabase.from("test_categories").select("id,name").order("name"),
  ]);
  if (!td) notFound();
  const test = td as MockTest;
  const qs = (qd ?? []) as Question[];
  const catOptions = [{ value: "", label: "— कोई नहीं —" }, ...((cd ?? []) as { id: string; name: string }[]).map((c) => ({ value: c.id, label: c.name }))];

  return (
    <>
      <AdminHeader title={`📝 ${test.title}`} subtitle={`${qs.length} सवाल • ${test.total_marks} अंक • ${test.duration_minutes} मिनट`} />
      <Link href="/admin/tests" className="pbtn pbtn-ghost" style={{ width: "fit-content" }}>← सभी Tests</Link>
      <Flash ok={ok} error={error} />

      <details className="adm-d">
        <summary><span>⚙️ Test की Settings</span><span className={`adm-tag ${test.is_published ? "" : "off"}`}>{test.is_published ? "Live" : "Draft"}</span></summary>
        <form action={saveTest} className="grid gap-3">
          <input type="hidden" name="id" value={test.id} />
          <Field label="Test का नाम" name="title" defaultValue={test.title} required />
          <Field label="परीक्षा" name="category_id" defaultValue={test.category_id ?? ""} options={catOptions} />
          <Field label="समय (मिनट)" name="duration_minutes" type="number" defaultValue={test.duration_minutes} required />
          <Field label="विवरण" name="description" rows={2} defaultValue={test.description} />
          <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={test.is_published} /> Live करो (Students को दिखे)</label>
          <button type="submit" className="pbtn pbtn-gold">Save करो</button>
        </form>
        <form action={deleteTest} className="su-row"><input type="hidden" name="id" value={test.id} /><DeleteButton label="पूरा Test हटाओ" /></form>
      </details>

      <details className="adm-d" open={qs.length === 0}>
        <summary>➕ नया सवाल</summary>
        <form action={saveQuestion}><QuestionFields testId={test.id} next={qs.length + 1} /></form>
      </details>

      {qs.map((q, i) => (
        <details key={q.id} className="adm-d">
          <summary><span>{i + 1}. {q.question_text.slice(0, 60)}</span><span className="adm-tag">{q.marks} अंक</span></summary>
          <form action={saveQuestion}><QuestionFields testId={test.id} q={q} next={i + 1} /></form>
          <form action={deleteQuestion} className="su-row">
            <input type="hidden" name="id" value={q.id} />
            <input type="hidden" name="test_id" value={test.id} />
            <DeleteButton label="सवाल हटाओ" />
          </form>
        </details>
      ))}
    </>
  );
}

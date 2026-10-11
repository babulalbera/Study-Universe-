import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveTest, saveTestCategory } from "@/features/admin/content-actions";
import type { MockTest } from "@/types/database";

export default async function AdminTestsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: cd }, { data: td }] = await Promise.all([
    supabase.from("test_categories").select("id,name").order("sort_order").order("name"),
    supabase.from("mock_tests").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const cats = (cd ?? []) as { id: string; name: string }[];
  const tests = (td ?? []) as MockTest[];
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const catOptions = [{ value: "", label: "— कोई नहीं —" }, ...cats.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <>
      <AdminHeader title="📝 Mock Tests" subtitle="Tests, Questions, सही उत्तर और Marks" />
      <Flash ok={ok} error={error} />

      <details className="adm-d">
        <summary>🎓 परीक्षाएँ ({cats.length})</summary>
        <form action={saveTestCategory} className="grid gap-3">
          <Field label="नई परीक्षा (जैसे SSC CGL)" name="name" required />
          <button type="submit" className="pbtn pbtn-gold">जोड़ो</button>
        </form>
        <p className="su-muted" style={{ marginTop: 10 }}>{cats.map((c) => c.name).join(" • ") || "अभी कोई नहीं"}</p>
      </details>

      <details className="adm-d" open={tests.length === 0}>
        <summary>➕ नया Test बनाओ</summary>
        <form action={saveTest} className="grid gap-3">
          <Field label="Test का नाम" name="title" required />
          <Field label="परीक्षा" name="category_id" defaultValue="" options={catOptions} />
          <Field label="समय (मिनट)" name="duration_minutes" type="number" defaultValue={60} required />
          <Field label="विवरण (ज़रूरी नहीं)" name="description" rows={2} />
          <button type="submit" className="pbtn pbtn-gold">बनाओ, फिर Sawal जोड़ो</button>
        </form>
      </details>

      {tests.length === 0 && <p className="su-muted">अभी कोई Test नहीं है।</p>}
      {tests.map((t) => (
        <Link key={t.id} href={`/admin/tests/${t.id}`} className="su-item">
          <div style={{ minWidth: 0 }}>
            <h3>{t.title}</h3>
            <p>{catName.get(t.category_id ?? "") ?? "—"} • {t.duration_minutes} मिनट • {t.total_marks} अंक</p>
          </div>
          <span className={`adm-tag ${t.is_published ? "" : "off"}`}>{t.is_published ? "Live" : "Draft"}</span>
        </Link>
      ))}
    </>
  );
}

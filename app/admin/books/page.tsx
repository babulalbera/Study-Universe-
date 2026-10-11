import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import BookUpload from "@/components/admin/BookUpload";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveBookCategory, deleteBookCategory, saveBook, deleteBook } from "@/features/admin/content-actions";
import type { Book, BookCategory } from "@/types/database";

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: cd }, { data: bd }] = await Promise.all([
    supabase.from("book_categories").select("*").order("sort_order").order("name"),
    supabase.from("books").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const cats = (cd ?? []) as BookCategory[];
  const books = (bd ?? []) as Book[];
  const catOptions = [{ value: "", label: "— कोई नहीं —" }, ...cats.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <>
      <AdminHeader title="📚 Books & PDF" subtitle="PDF Upload करना और Categories बनाना" />
      <Flash ok={ok} error={error} />

      <details className="adm-d" open={books.length === 0}>
        <summary>⬆️ नई PDF Upload करो</summary>
        <BookUpload categories={cats} />
      </details>

      <details className="adm-d">
        <summary>🗂 Categories ({cats.length})</summary>
        <form action={saveBookCategory} className="grid gap-3">
          <Field label="नई Category (जैसे Maths)" name="name" required />
          <button type="submit" className="pbtn pbtn-gold">Category जोड़ो</button>
        </form>
        <div className="su-list" style={{ marginTop: 12 }}>
          {cats.map((c) => (
            <form key={c.id} action={deleteBookCategory} className="su-item">
              <span>{c.name}</span>
              <input type="hidden" name="id" value={c.id} />
              <DeleteButton />
            </form>
          ))}
        </div>
      </details>

      {books.length === 0 && <p className="su-muted">अभी कोई Book नहीं है।</p>}
      {books.map((b) => (
        <details key={b.id} className="adm-d">
          <summary><span>{b.title}</span><span className={`adm-tag ${b.is_published ? "" : "off"}`}>{b.is_published ? "दिख रही" : "छिपी"}</span></summary>
          <form action={saveBook} className="grid gap-3">
            <input type="hidden" name="id" value={b.id} />
            <Field label="Title" name="title" defaultValue={b.title} required />
            <Field label="Author" name="author" defaultValue={b.author} />
            <Field label="Category" name="category_id" defaultValue={b.category_id ?? ""} options={catOptions} />
            <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={b.is_published} /> Students को दिखाओ</label>
            <button type="submit" className="pbtn pbtn-gold">Save करो</button>
          </form>
          <form action={deleteBook} className="su-row"><input type="hidden" name="id" value={b.id} /><DeleteButton label="Book + PDF हटाओ" /></form>
        </details>
      ))}
    </>
  );
}

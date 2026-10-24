import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import BookUpload from "@/components/admin/BookUpload";
import BookCoverEditor from "@/components/admin/BookCoverEditor";
import BookCover from "@/components/books/BookCover";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveBookCategory, deleteBookCategory, saveBook, deleteBook } from "@/features/admin/content-actions";
import { saveBookLink } from "@/features/admin/book-link-actions";
import { SOURCE_LABEL, type BookSource } from "@/lib/book-links";
import { MEDIUMS, MEDIUM_LABEL } from "@/lib/book-meta";
import type { Book, BookCategory } from "@/types/database";

const mediumOptions = [{ value: "", label: "— चुनो —" }, ...MEDIUMS.map((m) => ({ value: m, label: MEDIUM_LABEL[m] }))];

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
      <AdminHeader title="📚 Books & PDF" subtitle="PDF Upload या Link (Drive, Mega…) से Book जोड़ना" />
      <Flash ok={ok} error={error} />

      <details className="adm-d" open={books.length === 0}>
        <summary>➕ नई Book जोड़ो (PDF या Link)</summary>
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
          <summary>
            <BookCover path={b.cover_path} title={b.title} width={28} />
            <span>{b.title}</span>
            <span className="adm-tag">{b.external_url ? SOURCE_LABEL[(b.link_source as BookSource) ?? "other"] ?? "Link" : "PDF"}</span>
            <span className={`adm-tag ${b.is_published ? "" : "off"}`}>{b.is_published ? "दिख रही" : "छिपी"}</span>
          </summary>
          <BookCoverEditor id={b.id} title={b.title} coverPath={b.cover_path ?? null} />
          <form action={saveBook} className="grid gap-3">
            <input type="hidden" name="id" value={b.id} />
            <Field label="Title" name="title" defaultValue={b.title} required />
            <Field label="Author" name="author" defaultValue={b.author} />
            <Field label="Description (अधिकतम 500 अक्षर)" name="description" defaultValue={b.description ?? ""} rows={3} />
            <Field label="Category" name="category_id" defaultValue={b.category_id ?? ""} options={catOptions} />
            <Field label="Medium" name="medium" defaultValue={b.medium ?? ""} options={mediumOptions} />
            <Field label="Publisher" name="publisher" defaultValue={b.publisher ?? ""} />
            <Field label="Edition" name="edition" defaultValue={b.edition ?? ""} />
            <Field label="Exam (जैसे SSC CGL)" name="exam" defaultValue={b.exam ?? ""} />
            <Field label="Pages" name="pages" type="number" defaultValue={b.pages ?? ""} />
            <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={b.is_published} /> Students को दिखाओ</label>
            <button type="submit" className="pbtn pbtn-gold">Save करो</button>
          </form>
          {b.external_url && (
            <form action={saveBookLink} className="grid gap-3" style={{ marginTop: 12 }}>
              <input type="hidden" name="id" value={b.id} />
              <Field label="Book का Link" name="url" defaultValue={b.external_url} required />
              <button type="submit" className="pbtn pbtn-gold">Link बदलो</button>
            </form>
          )}
          <form action={deleteBook} className="su-row"><input type="hidden" name="id" value={b.id} /><DeleteButton label={b.external_url ? "Book हटाओ" : "Book + PDF हटाओ"} /></form>
        </details>
      ))}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { BOOKS_PER_PAGE, getBookCategories, getBooks } from "@/features/books/queries";
import { cn } from "@/lib/utils";
import BookmarkButton from "@/features/profile/dashboard/BookmarkButton";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Books & PDFs" };

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const cats = await getBookCategories();
  const cat = cats.find((c) => c.id === sp.cat)?.id ?? null;
  const { books, total } = await getBooks(cat, page);
  const user = await getUser();
  let savedIds = new Set<string>();
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("bookmarks").select("item_id").eq("item_type", "book");
    savedIds = new Set(((data ?? []) as { item_id: string }[]).map((x) => x.item_id));
  }
  const pages = Math.max(1, Math.ceil(total / BOOKS_PER_PAGE));
  const href = (c: string | null, p: number) => `/books?${[c && `cat=${c}`, p > 1 && `page=${p}`].filter(Boolean).join("&")}`;
  const catName = new Map(cats.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="📚 Books & PDFs" subtitle="Category चुनो, PDF पढ़ो या Download करो।" />
      {cats.length > 0 && (
        <div className="su-chips">
          <Link href="/books" className={cn("su-chip", !cat && "on")}>सब</Link>
          {cats.map((c) => <Link key={c.id} href={href(c.id, 1)} className={cn("su-chip", cat === c.id && "on")}>{c.name}</Link>)}
        </div>
      )}
      {books.length === 0 ? (
        <EmptyState icon="📖" title="अभी कोई Book/PDF नहीं है" text="Admin Panel से PDF Upload होते ही Category के हिसाब से यहाँ दिखेंगी।" />
      ) : (
        <div className="su-grid2">
          {books.map((b) => (
            <div key={b.id} className="su-item">
              <div style={{ minWidth: 0 }}>
                <h3>{b.title}</h3>
                <p>{[catName.get(b.category_id ?? ""), b.author].filter(Boolean).join(" • ") || "PDF"}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <BookmarkButton bookId={b.id} saved={savedIds.has(b.id)} loggedIn={Boolean(user)} />
                <a className="su-btn su-btn-primary" href={`/books/${b.id}/open`} target="_blank" rel="noopener noreferrer">📖 खोलो</a>
              </div>
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="su-row">
          {page > 1 && <Link className="su-btn su-btn-ghost" href={href(cat, page - 1)}>← पिछला</Link>}
          <span className="su-muted" style={{ alignSelf: "center" }}>{page} / {pages}</span>
          {page < pages && <Link className="su-btn su-btn-ghost" href={href(cat, page + 1)}>अगला →</Link>}
        </div>
      )}
    </>
  );
}

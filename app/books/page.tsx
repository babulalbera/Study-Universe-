import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import BookCover from "@/components/books/BookCover";
import ShareButton from "@/components/books/ShareButton";
import BookmarkButton from "@/features/bookmarks/BookmarkButton";
import { getBookmarkedBookIds } from "@/features/bookmarks/queries";
import { BOOKS_PER_PAGE, getBookCategories, getBooks } from "@/features/books/queries";
import { SOURCE_LABEL, type BookSource } from "@/lib/book-links";
import { MEDIUM_LABEL, type BookMedium } from "@/lib/book-meta";
import { cn } from "@/lib/utils";
import "./books.css";

export const metadata: Metadata = { title: "Books & PDFs" };

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const cats = await getBookCategories();
  const cat = cats.find((c) => c.id === sp.cat)?.id ?? null;
  const [{ books, total }, savedIds] = await Promise.all([getBooks(cat, page), getBookmarkedBookIds()]);
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
        <EmptyState icon="📖" title="अभी कोई Book/PDF नहीं है" text="Admin Panel से PDF या Link जुड़ते ही Category के हिसाब से यहाँ दिखेंगी।" />
      ) : (
        <div className="bk-grid">
          {books.map((b) => {
            const label = b.external_url ? SOURCE_LABEL[(b.link_source as BookSource) ?? "other"] ?? "Link" : "PDF";
            const medium = b.medium && b.medium in MEDIUM_LABEL ? MEDIUM_LABEL[b.medium as BookMedium] : null;
            // "PDF · English · 2018 · 46.7 MB"
            const info = [label, medium, b.published_year, b.file_size_mb ? `${b.file_size_mb} MB` : null].filter(Boolean).join(" · ");
            // category, exam, pages, publisher: chhoti dusri line
            const extra = [catName.get(b.category_id ?? ""), b.exam, b.pages ? `${b.pages} पेज` : null, b.publisher, b.edition].filter(Boolean).join(" • ");
            return (
              <div key={b.id} className="su-item bk-card">
                <BookCover path={b.cover_path} title={b.title} width={84} />
                <div className="bk-body">
                  <h3>{b.title}</h3>
                  {b.author && <p>👤 {b.author}</p>}
                  {b.description && <p className="bk-clamp">{b.description}</p>}
                  {extra && <p>{extra}</p>}
                  <p className="bk-info">{info}</p>
                  <div className="bk-actions">
                    <a className="su-btn su-btn-primary bk-btn" href={`/books/${b.id}/read`}>📖 Read</a>
                    <a className="su-btn su-btn-ghost bk-btn" href={`/books/${b.id}/open?dl=1`}>⬇ Download</a>
                    <ShareButton id={b.id} title={b.title} />
                    <BookmarkButton type="book" id={b.id} initialSaved={savedIds.has(b.id)} />
                  </div>
                </div>
              </div>
            );
          })}
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

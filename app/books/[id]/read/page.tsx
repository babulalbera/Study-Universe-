import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookCover from "@/components/books/BookCover";
import PdfReader from "@/components/books/PdfReader";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { embedUrl, parseBookLink } from "@/lib/book-links";
import { proxyTarget } from "@/lib/book-proxy";
import { MEDIUM_LABEL, type BookMedium } from "@/lib/book-meta";
import type { Book } from "@/types/database";

export const metadata: Metadata = { title: "Book पढ़ो" };
export const dynamic = "force-dynamic";

// Book isi website ke andar khulti hai. Login zaroori.
export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/books/${id}/read`)}`);

  const supabase = await createClient();
  // select("*") taaki migration 012 se pehle bhi page na toote
  const { data } = await supabase.from("books").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  const row = data as Book | null;
  if (!row) redirect("/books");

  // readerSrc  = premium reader ke liye PDF ka raasta
  // fallback   = reader na khol paye to purana iframe (Drive preview, Mega embed ...)
  let readerSrc: string | null = null;
  let fallback: string | null = null;
  if (row.storage_path) {
    const signed = await supabase.storage.from("books").createSignedUrl(row.storage_path, 3600);
    readerSrc = signed.data?.signedUrl ?? null;
  } else {
    const link = row.external_url ? parseBookLink(row.external_url) : null;
    if (link) {
      fallback = embedUrl(link.source, link.url);
      if (proxyTarget(link.source, link.url)) readerSrc = `/books/${id}/file`;
    }
  }

  // Profile ke "Continue Learning" ke liye haal hi kholi gayi book yaad rakho.
  await supabase.from("user_book_activity").upsert(
    { user_id: user.id, book_id: id, last_opened_at: new Date().toISOString() },
    { onConflict: "user_id,book_id" },
  );

  const medium = row.medium && row.medium in MEDIUM_LABEL ? MEDIUM_LABEL[row.medium as BookMedium] : null;
  const meta = [row.author, medium, row.exam, row.pages ? `${row.pages} पेज` : null, row.publisher, row.edition].filter(Boolean).join(" • ");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="su-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Link className="su-btn su-btn-ghost" href="/books">← Books</Link>
        <a className="su-btn su-btn-ghost" href={`/books/${id}/open`} target="_blank" rel="noopener noreferrer">↗ नए Tab में खोलो</a>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <BookCover path={row.cover_path} title={row.title} width={64} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>{row.title}</h1>
          {meta && <p className="su-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{meta}</p>}
        </div>
      </div>
      {row.description && <p className="su-muted" style={{ fontSize: 13 }}>{row.description}</p>}
      {readerSrc ? (
        <PdfReader src={readerSrc} fallback={fallback} title={row.title} bookId={id} />
      ) : fallback ? (
        <iframe
          src={fallback}
          title={row.title}
          allow="fullscreen"
          referrerPolicy="no-referrer"
          style={{ width: "100%", height: "calc(100dvh - 180px)", minHeight: 480, border: 0, borderRadius: 12, background: "#fff" }}
        />
      ) : (
        <p className="su-muted">
          इस Link की Book यहाँ नहीं खुल सकती। ऊपर “नए Tab में खोलो” दबाओ।
        </p>
      )}
    </div>
  );
}

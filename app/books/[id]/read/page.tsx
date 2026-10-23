import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { embedUrl, parseBookLink } from "@/lib/book-links";

export const metadata: Metadata = { title: "Book पढ़ो" };
export const dynamic = "force-dynamic";

// Book isi website ke andar khulti hai. Login zaroori.
export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/books/${id}/read`)}`);

  const supabase = await createClient();
  const { data } = await supabase.from("books").select("title, storage_path, external_url").eq("id", id).eq("is_published", true).maybeSingle();
  const row = data as { title: string; storage_path: string | null; external_url: string | null } | null;
  if (!row) redirect("/books");

  let src: string | null = null;
  if (row.storage_path) {
    const signed = await supabase.storage.from("books").createSignedUrl(row.storage_path, 3600);
    src = signed.data?.signedUrl ?? null;
  } else {
    const link = row.external_url ? parseBookLink(row.external_url) : null;
    if (link) src = embedUrl(link.source, link.url);
  }

  // Profile ke "Continue Learning" ke liye haal hi kholi gayi book yaad rakho.
  await supabase.from("user_book_activity").upsert(
    { user_id: user.id, book_id: id, last_opened_at: new Date().toISOString() },
    { onConflict: "user_id,book_id" },
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="su-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Link className="su-btn su-btn-ghost" href="/books">← Books</Link>
        <a className="su-btn su-btn-ghost" href={`/books/${id}/open`} target="_blank" rel="noopener noreferrer">↗ नए Tab में खोलो</a>
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>{row.title}</h1>
      {src ? (
        <iframe
          src={src}
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

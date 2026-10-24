import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { parseBookLink } from "@/lib/book-links";

// Login zaroori. PDF wali Book ka kuch der chalne wala signed link banta hai; link wali Book (Drive/Mega/...) seedha uske link par jaati hai.
// ?dl=1 lagao to PDF seedha Download hoti hai (Books page ka Download button).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const origin = url.origin;
  const download = url.searchParams.get("dl") === "1";
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(`/books/${id}/open${download ? "?dl=1" : ""}`)}`);

  const supabase = await createClient();
  const { data } = await supabase.from("books").select("title, storage_path, external_url").eq("id", id).eq("is_published", true).maybeSingle();
  const row = data as { title: string; storage_path: string | null; external_url: string | null } | null;
  const path = row?.storage_path;
  const external = row?.external_url ? parseBookLink(row.external_url) : null; // dobara jaanch: sirf safe https link
  if (!path && !external) return NextResponse.redirect(`${origin}/books`);

  let target: string;
  if (path) {
    const fileName = `${(row?.title ?? "book").replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 80) || "book"}.pdf`;
    const signed = await supabase.storage.from("books").createSignedUrl(path, 120, download ? { download: fileName } : undefined);
    if (signed.error || !signed.data) return NextResponse.redirect(`${origin}/books`);
    target = signed.data.signedUrl;
  } else {
    target = external!.url;
  }

  // Haal hi kholi gayi book yaad rakho (Profile ke "Continue Learning" ke liye). Progress ko nahi chhedta.
  await supabase.from("user_book_activity").upsert(
    { user_id: user.id, book_id: id, last_opened_at: new Date().toISOString() },
    { onConflict: "user_id,book_id" },
  );

  return NextResponse.redirect(target);
}

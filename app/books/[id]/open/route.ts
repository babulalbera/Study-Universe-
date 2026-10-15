import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

// Private PDF: login zaroori. Kuch der chalne wala signed link banta hai, seedha file ka link kabhi nahi.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const origin = new URL(req.url).origin;
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(`/books/${id}/open`)}`);

  const supabase = await createClient();
  const { data } = await supabase.from("books").select("storage_path").eq("id", id).eq("is_published", true).maybeSingle();
  const path = (data as { storage_path: string | null } | null)?.storage_path;
  if (!path) return NextResponse.redirect(`${origin}/books`);

  await supabase.from("user_book_activity").upsert({ user_id: user.id, book_id: id, last_opened_at: new Date().toISOString() });
  const signed = await supabase.storage.from("books").createSignedUrl(path, 120);
  if (signed.error || !signed.data) return NextResponse.redirect(`${origin}/books`);
  return NextResponse.redirect(signed.data.signedUrl);
}

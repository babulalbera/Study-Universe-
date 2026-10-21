import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export type ContinueBook = { id: string; title: string; author: string; pages: number | null; lastPage: number; pct: number; ago: string };

function agoText(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "Aaj";
  if (days === 1) return "Kal";
  return `${days} din pehle`;
}

// Sabse haal hi kholi gayi published book (sirf apni, RLS se)
export async function getContinueBook(): Promise<ContinueBook | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_book_activity")
    .select("last_opened_at,last_page,progress_pct,books(id,title,author,pages,is_published)")
    .eq("user_id", user.id)
    .order("last_opened_at", { ascending: false })
    .limit(5);

  type Row = {
    last_opened_at: string; last_page: number | null; progress_pct: number | null;
    books: { id: string; title: string; author: string | null; pages: number | null; is_published: boolean } | null;
  };
  const row = ((data ?? []) as unknown as Row[]).find((r) => r.books && r.books.is_published);
  if (!row || !row.books) return null;
  return {
    id: row.books.id,
    title: row.books.title,
    author: row.books.author ?? "",
    pages: row.books.pages ?? null,
    lastPage: row.last_page ?? 0,
    pct: Math.max(0, Math.min(100, Number(row.progress_pct ?? 0))),
    ago: agoText(row.last_opened_at),
  };
}

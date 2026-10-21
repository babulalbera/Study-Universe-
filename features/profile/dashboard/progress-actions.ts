"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProgressResult = { ok: boolean; pct?: number; page?: number; error?: string };

// Book ka progress save. Pages pata ho to % khud nikalta hai, warna user ka diya % (0-100).
export async function saveBookProgress(bookId: string, page: number, pctInput: number | null): Promise<ProgressResult> {
  if (typeof bookId !== "string" || !UUID.test(bookId)) return { ok: false, error: "Galat book" };
  const user = await getUser();
  if (!user) return { ok: false, error: "Pehle login karo" };

  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select("pages").eq("id", bookId).eq("is_published", true).maybeSingle();
  if (!book) return { ok: false, error: "Book nahi mili" };
  const pages = (book as { pages: number | null }).pages;

  let p = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
  let pct: number;
  if (pages && pages > 0) {
    p = Math.min(p, pages);
    pct = Math.min(100, Math.round((p / pages) * 100));
  } else if (pctInput != null && Number.isFinite(pctInput)) {
    pct = Math.max(0, Math.min(100, Math.round(pctInput)));
    p = Math.min(p, 100000);
  } else {
    return { ok: false, error: "Percent (0-100) likho" };
  }

  const { error } = await supabase.rpc("save_book_progress", { p_book: bookId, p_page: p, p_pct: pct });
  if (error) return { ok: false, error: "Save nahi ho paya, dobara try karo" };

  revalidatePath("/profile");
  return { ok: true, pct, page: p };
}

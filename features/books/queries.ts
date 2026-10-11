import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Book, BookCategory } from "@/types/database";

export const BOOKS_PER_PAGE = 12;

export async function getBookCategories(): Promise<BookCategory[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("book_categories").select("*").order("sort_order").order("name");
  return (data ?? []) as BookCategory[];
}

export async function getBooks(categoryId: string | null, page: number): Promise<{ books: Book[]; total: number }> {
  if (!isSupabaseConfigured()) return { books: [], total: 0 };
  const supabase = await createClient();
  const from = (page - 1) * BOOKS_PER_PAGE;
  let q = supabase.from("books").select("*", { count: "exact" }).eq("is_published", true);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, count } = await q.order("created_at", { ascending: false }).range(from, from + BOOKS_PER_PAGE - 1);
  return { books: (data ?? []) as Book[], total: count ?? 0 };
}

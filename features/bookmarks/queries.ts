import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export type FavBook = { id: string; title: string; author: string };
export type FavTest = { id: string; title: string };

// Meri favorites (sirf apni, RLS se). Sirf wahi dikhte hain jo abhi published hain.
export async function getFavorites(): Promise<{ books: FavBook[]; tests: FavTest[] }> {
  const user = await getUser();
  if (!user) return { books: [], tests: [] };
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookmarks").select("item_type,item_id")
    .eq("user_id", user.id).in("item_type", ["book", "test"])
    .order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as { item_type: "book" | "test"; item_id: string }[];
  const bookIds = rows.filter((r) => r.item_type === "book").map((r) => r.item_id);
  const testIds = rows.filter((r) => r.item_type === "test").map((r) => r.item_id);

  const [b, t] = await Promise.all([
    bookIds.length ? supabase.from("books").select("id,title,author").in("id", bookIds).eq("is_published", true) : Promise.resolve({ data: [] }),
    testIds.length ? supabase.from("mock_tests").select("id,title").in("id", testIds).eq("is_published", true) : Promise.resolve({ data: [] }),
  ]);

  const bookMap = new Map(((b.data ?? []) as FavBook[]).map((x) => [x.id, x]));
  const testMap = new Map(((t.data ?? []) as FavTest[]).map((x) => [x.id, x]));
  return {
    books: bookIds.map((id) => bookMap.get(id)).filter((x): x is FavBook => Boolean(x)),
    tests: testIds.map((id) => testMap.get(id)).filter((x): x is FavTest => Boolean(x)),
  };
}

// Books page par ❤ ka status dikhane ke liye
export async function getBookmarkedBookIds(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookmarks").select("item_id").eq("user_id", user.id).eq("item_type", "book").limit(200);
  return new Set(((data ?? []) as { item_id: string }[]).map((x) => x.item_id));
}

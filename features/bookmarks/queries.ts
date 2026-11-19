import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export type FavBook = { id: string; title: string; author: string };
export type FavTest = { id: string; title: string };
export type FavFolder = { id: string; title: string; course_id: string; course_title: string };

// Meri favorites (sirf apni, RLS se). Sirf wahi dikhte hain jo abhi published hain.
export async function getFavorites(): Promise<{ books: FavBook[]; tests: FavTest[]; folders: FavFolder[] }> {
  const user = await getUser();
  if (!user) return { books: [], tests: [], folders: [] };
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookmarks").select("item_type,item_id")
    .eq("user_id", user.id).in("item_type", ["book", "test", "folder"])
    .order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as { item_type: "book" | "test" | "folder"; item_id: string }[];
  const bookIds = rows.filter((r) => r.item_type === "book").map((r) => r.item_id);
  const testIds = rows.filter((r) => r.item_type === "test").map((r) => r.item_id);
  const folderIds = rows.filter((r) => r.item_type === "folder").map((r) => r.item_id);

  const [b, t, f] = await Promise.all([
    bookIds.length ? supabase.from("books").select("id,title,author").in("id", bookIds).eq("is_published", true) : Promise.resolve({ data: [] }),
    testIds.length ? supabase.from("mock_tests").select("id,title").in("id", testIds).eq("is_published", true) : Promise.resolve({ data: [] }),
    folderIds.length ? supabase.from("course_folders").select("id,title,course_id").in("id", folderIds).eq("is_published", true) : Promise.resolve({ data: [] }),
  ]);

  // Folder ke saath uska Course ka naam bhi (Course published ho tabhi dikhao)
  const fRows = (f.data ?? []) as { id: string; title: string; course_id: string }[];
  const courseIds = [...new Set(fRows.map((x) => x.course_id))];
  const c = courseIds.length ? await supabase.from("courses").select("id,title").in("id", courseIds).eq("is_published", true) : { data: [] };
  const courseMap = new Map(((c.data ?? []) as { id: string; title: string }[]).map((x) => [x.id, x.title]));

  const bookMap = new Map(((b.data ?? []) as FavBook[]).map((x) => [x.id, x]));
  const testMap = new Map(((t.data ?? []) as FavTest[]).map((x) => [x.id, x]));
  const folderMap = new Map<string, FavFolder>(
    fRows.filter((x) => courseMap.has(x.course_id)).map((x) => [x.id, { id: x.id, title: x.title, course_id: x.course_id, course_title: courseMap.get(x.course_id) ?? "" }]),
  );
  return {
    books: bookIds.map((id) => bookMap.get(id)).filter((x): x is FavBook => Boolean(x)),
    tests: testIds.map((id) => testMap.get(id)).filter((x): x is FavTest => Boolean(x)),
    folders: folderIds.map((id) => folderMap.get(id)).filter((x): x is FavFolder => Boolean(x)),
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

// Course page par Folder cards ke ❤ ka status dikhane ke liye
export async function getBookmarkedFolderIds(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookmarks").select("item_id").eq("user_id", user.id).eq("item_type", "folder").limit(200);
  return new Set(((data ?? []) as { item_id: string }[]).map((x) => x.item_id));
}

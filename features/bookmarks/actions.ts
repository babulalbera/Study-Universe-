"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BOOKMARKS = 200;

export type BookmarkResult = { ok: boolean; saved?: boolean; error?: string };

// Favorites me jodo / hatao. Har baar server par jaanch hoti hai (login, sahi id, published item).
export async function toggleBookmark(itemType: "book" | "test", itemId: string): Promise<BookmarkResult> {
  if (itemType !== "book" && itemType !== "test") return { ok: false, error: "Galat type" };
  if (typeof itemId !== "string" || !UUID.test(itemId)) return { ok: false, error: "Galat item" };

  const user = await getUser();
  if (!user) return { ok: false, error: "Pehle login karo" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("bookmarks").select("id").eq("user_id", user.id).eq("item_type", itemType).eq("item_id", itemId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", (existing as { id: string }).id);
    if (error) return { ok: false, error: "Hata nahi paye, dobara try karo" };
  } else {
    const { count } = await supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) >= MAX_BOOKMARKS) return { ok: false, error: `Sirf ${MAX_BOOKMARKS} favorites ho sakte hain` };

    const table = itemType === "book" ? "books" : "mock_tests";
    const { data: item } = await supabase.from(table).select("id").eq("id", itemId).eq("is_published", true).maybeSingle();
    if (!item) return { ok: false, error: "Ye item nahi mila" };

    const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, item_type: itemType, item_id: itemId });
    if (error) return { ok: false, error: "Jod nahi paye, dobara try karo" };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/favorites");
  revalidatePath("/books");
  return { ok: true, saved: !existing };
}

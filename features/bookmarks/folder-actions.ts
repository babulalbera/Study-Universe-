"use server";
// Course ke Folder ko Favorites me jodo / hatao (Books aur Tests ki tarah, tumhare account me save hota hai).
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BOOKMARKS = 200;

type Result = { ok: boolean; saved?: boolean; error?: string };

export async function toggleFolderFav(folderId: string): Promise<Result> {
  if (typeof folderId !== "string" || !UUID.test(folderId)) return { ok: false, error: "Galat Folder" };

  const user = await getUser();
  if (!user) return { ok: false, error: "Pehle login karo" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("bookmarks").select("id").eq("user_id", user.id).eq("item_type", "folder").eq("item_id", folderId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", (existing as { id: string }).id);
    if (error) return { ok: false, error: "Hata nahi paye, dobara try karo" };
  } else {
    const { count } = await supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) >= MAX_BOOKMARKS) return { ok: false, error: `Sirf ${MAX_BOOKMARKS} favorites ho sakte hain` };

    const { data: folder } = await supabase.from("course_folders").select("id").eq("id", folderId).eq("is_published", true).maybeSingle();
    if (!folder) return { ok: false, error: "Ye Folder nahi mila" };

    const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, item_type: "folder", item_id: folderId });
    if (error) {
      // 23514 = database ke check me "folder" abhi allowed nahi (Supabase SQL chalana baaki hai)
      return { ok: false, error: error.code === "23514" ? "Database me Folder favourite abhi chalu nahi hai (Supabase SQL chalao)" : "Jod nahi paye, dobara try karo" };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/favorites");
  revalidatePath("/courses/[id]", "page");
  return { ok: true, saved: !existing };
}

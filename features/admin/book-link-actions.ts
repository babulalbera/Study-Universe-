"use server";
import { audit, back, ctx, refresh, s } from "./helpers";
import { parseBookLink } from "@/lib/book-links";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINK_ERR = "Link sahi nahi hai. https:// se shuru hone wala Drive, Mega, Dropbox jaisa link daalo";

// Book ko PDF upload ke bajay link se add karo (Google Drive, Mega, Dropbox, OneDrive, MediaFire, Telegram ya koi bhi https link).
export async function createBookFromLink(input: { title: string; author: string; categoryId: string; url: string }): Promise<{ error?: string }> {
  const c = await ctx();
  const title = input.title.trim();
  if (title.length < 2) return { error: "Title likho" };
  const link = parseBookLink(input.url);
  if (!link) return { error: LINK_ERR };
  const { error } = await c.supabase.from("books").insert({
    title, author: input.author.trim(), category_id: UUID.test(input.categoryId) ? input.categoryId : null,
    storage_path: null, external_url: link.url, link_source: link.source, created_by: c.profile.id,
  });
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "create", "books", null, { title, source: link.source });
  await c.supabase.from("notifications").insert({ title: "Nayi Book aayi hai", body: title, kind: "book" });
  refresh(["/admin/books", "/books"]);
  return {};
}

// Link wali Book ka link badalna.
export async function saveBookLink(formData: FormData) {
  const P = "/admin/books";
  const c = await ctx();
  const id = s(formData, "id");
  const link = parseBookLink(s(formData, "url"));
  if (!UUID.test(id)) back(P, "error", "Book nahi mili");
  if (!link) back(P, "error", LINK_ERR);
  const { error } = await c.supabase.from("books").update({ external_url: link!.url, link_source: link!.source }).eq("id", id);
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, "update", "books", id, { source: link!.source });
  refresh([P, "/books"]);
  back(P, "ok", "Link badal gaya ✓");
}

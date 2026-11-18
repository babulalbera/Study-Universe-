"use server";
// Folder (Folder ke andar Folder samet) aur Video ko badalna/hatana. Kaam ke baad admin usi Folder me wapas aata hai.
import { redirect } from "next/navigation";
import { audit, ctx, num, on, refresh, s } from "./helpers";
import { UPLOAD_PATH_RE, VIDEO_LINK_ERR, parseVideoLink } from "@/lib/video-links";
import { COVER_BUCKET, isCoverPath } from "@/lib/book-meta";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "course-videos";
const MAX_LEVEL = 6; // Folder ke andar Folder ke andar... itne level tak
type Row = { id: string; parent_id: string | null; cover_path?: string | null };
type Ctx = Awaited<ReturnType<typeof ctx>>;
const maybeUuid = (v: string) => (UUID.test(v) ? v : null);
const paths = (courseId: string) => [`/admin/courses/${courseId}`, "/admin/courses", "/courses", `/courses/${courseId}`];
const retFolder = (f: FormData) => { const v = s(f, "return_folder"); return UUID.test(v) ? v : ""; };
const here = (courseId: string, folder: string) => `/admin/courses/${courseId}${folder ? `?folder=${folder}` : ""}`;
function go(path: string, kind: "ok" | "error", msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);
}
async function dropCovers(c: Ctx, list: (string | null | undefined)[]) {
  const files = list.filter((p): p is string => !!p && isCoverPath(p));
  if (files.length) await c.supabase.storage.from(COVER_BUCKET).remove(files);
}

// ================= Folders =================
export async function saveFolder(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  if (!UUID.test(courseId)) go("/admin/courses", "error", "Course nahi mila");
  const P = here(courseId, retFolder(formData));
  const id = s(formData, "id");
  if (id && !UUID.test(id)) go(P, "error", "Folder nahi mila");
  const title = s(formData, "title");
  if (title.length < 2) go(P, "error", "Folder ka naam likho");
  const row: Record<string, unknown> = { title: title.slice(0, 100), sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published") };
  if (formData.has("description")) row.description = s(formData, "description").slice(0, 500);

  if (formData.has("parent_id")) {
    const parent = s(formData, "parent_id");
    if (!parent) {
      row.parent_id = null;
    } else {
      if (!UUID.test(parent)) go(P, "error", "Upar wala Folder nahi mila");
      const { data } = await c.supabase.from("course_folders").select("id, parent_id").eq("course_id", courseId).limit(500);
      const up = new Map(((data ?? []) as Row[]).map((f) => [f.id, f.parent_id]));
      if (!up.has(parent)) go(P, "error", "Upar wala Folder nahi mila");
      let level = 1;
      let cur: string | null = parent;
      while (cur && level < 30) {
        if (cur === id) go(P, "error", "Folder apne hi andar nahi ja sakta");
        level++;
        cur = up.get(cur) ?? null;
      }
      if (level > MAX_LEVEL) go(P, "error", `Folder ${MAX_LEVEL} level se zyada gehra nahi ho sakta`);
      row.parent_id = parent;
    }
  }

  const { error } = id
    ? await c.supabase.from("course_folders").update(row).eq("id", id).eq("course_id", courseId)
    : await c.supabase.from("course_folders").insert({ ...row, course_id: courseId });
  if (error) go(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "course_folders", id || null, { title });
  refresh(paths(courseId));
  go(P, "ok", id ? "Folder save ho gaya ✓" : "Folder ban gaya ✓");
}

export async function deleteFolder(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  const id = s(formData, "id");
  if (!UUID.test(courseId) || !UUID.test(id)) go("/admin/courses", "error", "Folder nahi mila");
  const back = retFolder(formData);
  const P = here(courseId, back === id ? "" : back);
  // Is Folder ke andar ke saare Folders (aur unke videos ki upload files) bhi hatenge
  const { data: fs } = await c.supabase.from("course_folders").select("id, parent_id, cover_path").eq("course_id", courseId).limit(500);
  const all = (fs ?? []) as Row[];
  const ids = [id];
  for (let i = 0; i < ids.length; i++) for (const f of all) if (f.parent_id === ids[i] && !ids.includes(f.id)) ids.push(f.id);
  const { data: vids } = await c.supabase.from("course_videos").select("storage_path, thumb_path, source").in("folder_id", ids);
  const rows = (vids ?? []) as { storage_path: string | null; thumb_path: string | null; source: string }[];
  const files = rows.filter((v) => v.source === "upload").map((v) => v.storage_path).filter((p): p is string => !!p);
  const { error } = await c.supabase.from("course_folders").delete().eq("id", id).eq("course_id", courseId);
  if (error) go(P, "error", "Hata nahi paya");
  if (files.length) await c.supabase.storage.from(BUCKET).remove(files);
  await dropCovers(c, [...rows.map((v) => v.thumb_path), ...all.filter((f) => ids.includes(f.id)).map((f) => f.cover_path)]);
  await audit(c, "delete", "course_folders", id);
  refresh(paths(courseId));
  go(P, "ok", "Folder, uske andar ke Folders aur saare Videos hata diye ✓");
}

// Folder ki photo: browser se pehle hi bucket me upload ho chuki hoti hai. path=null matlab photo hatao.
export async function setFolderCover(courseId: string, folderId: string, path: string | null): Promise<{ error?: string }> {
  const c = await ctx();
  if (!UUID.test(courseId) || !UUID.test(folderId)) return { error: "Folder nahi mila" };
  if (path !== null && !isCoverPath(path)) return { error: "Photo ka path galat hai" };
  const { error } = await c.supabase.from("course_folders").update({ cover_path: path }).eq("id", folderId).eq("course_id", courseId);
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "update", "course_folders", folderId, { cover: path ? "set" : "removed" });
  refresh(paths(courseId));
  return {};
}

// ================= Videos (badlo / hatao) =================
export async function saveVideo(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  const id = s(formData, "id");
  if (!UUID.test(courseId) || !UUID.test(id)) go("/admin/courses", "error", "Video nahi mila");
  const P = here(courseId, retFolder(formData));
  const title = s(formData, "title");
  const description = s(formData, "description");
  if (title.length < 2) go(P, "error", "Video ka title likho");
  if (description.length > 500) go(P, "error", "Description 500 akshar se chhota ho");
  let linkPart: { source: string; url: string } | null = null;
  if (formData.has("url")) { // sirf link wale videos me ye box hota hai
    linkPart = parseVideoLink(s(formData, "url"));
    if (!linkPart) go(P, "error", VIDEO_LINK_ERR);
  }
  const { error } = await c.supabase.from("course_videos").update({
    title: title.slice(0, 150), description, folder_id: maybeUuid(s(formData, "folder_id")),
    sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published"), ...(linkPart ?? {}),
  }).eq("id", id).eq("course_id", courseId);
  if (error) go(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, "update", "course_videos", id, { title });
  refresh(paths(courseId));
  go(P, "ok", "Video save ho gaya ✓");
}

export async function deleteVideo(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  const id = s(formData, "id");
  if (!UUID.test(courseId) || !UUID.test(id)) go("/admin/courses", "error", "Video nahi mila");
  const P = here(courseId, retFolder(formData));
  const { data } = await c.supabase.from("course_videos").select("storage_path, thumb_path").eq("id", id).maybeSingle();
  const row = data as { storage_path: string | null; thumb_path: string | null } | null;
  const { error } = await c.supabase.from("course_videos").delete().eq("id", id).eq("course_id", courseId);
  if (error) go(P, "error", "Hata nahi paya");
  if (row?.storage_path && UPLOAD_PATH_RE.test(row.storage_path)) await c.supabase.storage.from(BUCKET).remove([row.storage_path]);
  await dropCovers(c, [row?.thumb_path]);
  await audit(c, "delete", "course_videos", id);
  refresh(paths(courseId));
  go(P, "ok", "Video hata diya ✓");
}

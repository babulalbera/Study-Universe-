"use server";
// Folder banana / badalna / hatana, Folder ke andar Folder ke saath.
import { audit, back, ctx, num, on, refresh, s } from "./helpers";
import { COVER_BUCKET, isCoverPath } from "@/lib/book-meta";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "course-videos";
const MAX_LEVEL = 6; // Folder ke andar Folder ke andar... itne level tak
type Row = { id: string; parent_id: string | null };
const paths = (courseId: string) => [`/admin/courses/${courseId}`, "/admin/courses", "/courses", `/courses/${courseId}`];

export async function saveFolder(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  if (!UUID.test(courseId)) back("/admin/courses", "error", "Course nahi mila");
  const P = `/admin/courses/${courseId}`;
  const id = s(formData, "id");
  if (id && !UUID.test(id)) back(P, "error", "Folder nahi mila");
  const title = s(formData, "title");
  if (title.length < 2) back(P, "error", "Folder ka naam likho");
  const row: Record<string, unknown> = { title: title.slice(0, 100), sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published") };

  if (formData.has("parent_id")) {
    const parent = s(formData, "parent_id");
    if (!parent) {
      row.parent_id = null;
    } else {
      if (!UUID.test(parent)) back(P, "error", "Upar wala Folder nahi mila");
      const { data } = await c.supabase.from("course_folders").select("id, parent_id").eq("course_id", courseId).limit(500);
      const up = new Map(((data ?? []) as Row[]).map((f) => [f.id, f.parent_id]));
      if (!up.has(parent)) back(P, "error", "Upar wala Folder nahi mila");
      let level = 1;
      let cur: string | null = parent;
      while (cur && level < 30) {
        if (cur === id) back(P, "error", "Folder apne hi andar nahi ja sakta");
        level++;
        cur = up.get(cur) ?? null;
      }
      if (level > MAX_LEVEL) back(P, "error", `Folder ${MAX_LEVEL} level se zyada gehra nahi ho sakta`);
      row.parent_id = parent;
    }
  }

  const { error } = id
    ? await c.supabase.from("course_folders").update(row).eq("id", id).eq("course_id", courseId)
    : await c.supabase.from("course_folders").insert({ ...row, course_id: courseId });
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "course_folders", id || null, { title });
  refresh(paths(courseId));
  back(P, "ok", "Folder save ho gaya ✓");
}

export async function deleteFolder(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  const id = s(formData, "id");
  if (!UUID.test(courseId) || !UUID.test(id)) back("/admin/courses", "error", "Folder nahi mila");
  const P = `/admin/courses/${courseId}`;
  // Is Folder ke andar ke saare Folders (aur unke videos ki upload files) bhi hatenge
  const { data: fs } = await c.supabase.from("course_folders").select("id, parent_id").eq("course_id", courseId).limit(500);
  const all = (fs ?? []) as Row[];
  const ids = [id];
  for (let i = 0; i < ids.length; i++) for (const f of all) if (f.parent_id === ids[i] && !ids.includes(f.id)) ids.push(f.id);
  const { data: vids } = await c.supabase.from("course_videos").select("storage_path, thumb_path, source").in("folder_id", ids);
  const rows = (vids ?? []) as { storage_path: string | null; thumb_path: string | null; source: string }[];
  const files = rows.filter((v) => v.source === "upload").map((v) => v.storage_path).filter((p): p is string => !!p);
  const { error } = await c.supabase.from("course_folders").delete().eq("id", id).eq("course_id", courseId);
  if (error) back(P, "error", "Hata nahi paya");
  if (files.length) await c.supabase.storage.from(BUCKET).remove(files);
  const covers = rows.map((v) => v.thumb_path).filter((p): p is string => !!p && isCoverPath(p));
  if (covers.length) await c.supabase.storage.from(COVER_BUCKET).remove(covers);
  await audit(c, "delete", "course_folders", id);
  refresh(paths(courseId));
  back(P, "ok", "Folder, uske andar ke Folders aur saare Videos hata diye ✓");
}

"use server";
import { audit, back, ctx, num, on, refresh, s } from "./helpers";
import { UPLOAD_PATH_RE, VIDEO_LINK_ERR, parseVideoLink } from "@/lib/video-links";
import { COVER_BUCKET, isCoverPath } from "@/lib/book-meta";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "course-videos";
const maybeUuid = (v: string) => (UUID.test(v) ? v : null);
type Ctx = Awaited<ReturnType<typeof ctx>>;
// Photo / thumbnail ki files bucket se hatao (kuch na mile to chup-chaap aage badho)
async function dropCovers(c: Ctx, list: (string | null | undefined)[]) {
  const files = list.filter((p): p is string => !!p && isCoverPath(p));
  if (files.length) await c.supabase.storage.from(COVER_BUCKET).remove(files);
}
const paths = (courseId: string) => [`/admin/courses/${courseId}`, "/admin/courses", "/courses", `/courses/${courseId}`];

// ================= Folders =================
export async function saveFolder(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  if (!UUID.test(courseId)) back("/admin/courses", "error", "Course nahi mila");
  const P = `/admin/courses/${courseId}`;
  const id = s(formData, "id");
  if (id && !UUID.test(id)) back(P, "error", "Folder nahi mila");
  const title = s(formData, "title");
  if (title.length < 2) back(P, "error", "Folder ka naam likho");
  const row = { title: title.slice(0, 100), sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published") };
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
  // Folder ke andar upload kiye videos ki files bhi hatani hain (DB se rows apne aap hatengi)
  const { data: vids } = await c.supabase.from("course_videos").select("storage_path, thumb_path, source").eq("folder_id", id);
  const rows = (vids ?? []) as { storage_path: string | null; thumb_path: string | null; source: string }[];
  const files = rows.filter((v) => v.source === "upload").map((v) => v.storage_path).filter((p): p is string => !!p);
  const { error } = await c.supabase.from("course_folders").delete().eq("id", id).eq("course_id", courseId);
  if (error) back(P, "error", "Hata nahi paya");
  if (files.length) await c.supabase.storage.from(BUCKET).remove(files);
  await dropCovers(c, rows.map((v) => v.thumb_path));
  await audit(c, "delete", "course_folders", id);
  refresh(paths(courseId));
  back(P, "ok", "Folder aur uske saare Videos hata diye ✓");
}

// ================= Videos =================
type NewVideo = { courseId: string; folderId: string; title: string; description: string; thumbPath?: string };

function checkNew(input: NewVideo): string | null {
  if (!UUID.test(input.courseId)) return "Course nahi mila";
  if (input.title.trim().length < 2) return "Video ka title likho";
  if (input.description.length > 500) return "Description 500 akshar se chhota ho";
  if (input.thumbPath && !isCoverPath(input.thumbPath)) return "Photo ka path galat hai";
  return null;
}

// Link se video jodo (YouTube, Drive, MEGA, seedha .mp4)
export async function createVideoFromLink(input: NewVideo & { url: string }): Promise<{ error?: string }> {
  const c = await ctx();
  const bad = checkNew(input);
  if (bad) return { error: bad };
  const link = parseVideoLink(input.url);
  if (!link) return { error: VIDEO_LINK_ERR };
  const { error } = await c.supabase.from("course_videos").insert({
    course_id: input.courseId, folder_id: maybeUuid(input.folderId), title: input.title.trim().slice(0, 150),
    description: input.description.trim(), source: link.source, url: link.url, thumb_path: input.thumbPath || null, created_by: c.profile.id,
  });
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "create", "course_videos", null, { title: input.title, source: link.source });
  refresh(paths(input.courseId));
  return {};
}

// File browser se Storage me pehle hi upload ho chuki hoti hai, yahan sirf uski jaankari save hoti hai
export async function createVideoFromUpload(input: NewVideo & { storagePath: string }): Promise<{ error?: string }> {
  const c = await ctx();
  const bad = checkNew(input);
  if (bad) return { error: bad };
  if (!UPLOAD_PATH_RE.test(input.storagePath)) return { error: "File ka path galat hai" };
  const { error } = await c.supabase.from("course_videos").insert({
    course_id: input.courseId, folder_id: maybeUuid(input.folderId), title: input.title.trim().slice(0, 150),
    description: input.description.trim(), source: "upload", url: null, storage_path: input.storagePath, thumb_path: input.thumbPath || null, created_by: c.profile.id,
  });
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "create", "course_videos", null, { title: input.title, source: "upload" });
  refresh(paths(input.courseId));
  return {};
}

export async function saveVideo(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  const id = s(formData, "id");
  if (!UUID.test(courseId) || !UUID.test(id)) back("/admin/courses", "error", "Video nahi mila");
  const P = `/admin/courses/${courseId}`;
  const title = s(formData, "title");
  const description = s(formData, "description");
  if (title.length < 2) back(P, "error", "Video ka title likho");
  if (description.length > 500) back(P, "error", "Description 500 akshar se chhota ho");

  let linkPart: { source: string; url: string } | null = null;
  if (formData.has("url")) { // sirf link wale videos me ye box hota hai
    linkPart = parseVideoLink(s(formData, "url"));
    if (!linkPart) back(P, "error", VIDEO_LINK_ERR);
  }
  const { error } = await c.supabase.from("course_videos").update({
    title: title.slice(0, 150), description, folder_id: maybeUuid(s(formData, "folder_id")),
    sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published"), ...(linkPart ?? {}),
  }).eq("id", id).eq("course_id", courseId);
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, "update", "course_videos", id, { title });
  refresh(paths(courseId));
  back(P, "ok", "Video save ho gaya ✓");
}

export async function deleteVideo(formData: FormData) {
  const c = await ctx();
  const courseId = s(formData, "course_id");
  const id = s(formData, "id");
  if (!UUID.test(courseId) || !UUID.test(id)) back("/admin/courses", "error", "Video nahi mila");
  const P = `/admin/courses/${courseId}`;
  const { data } = await c.supabase.from("course_videos").select("storage_path, thumb_path").eq("id", id).maybeSingle();
  const row = data as { storage_path: string | null; thumb_path: string | null } | null;
  const { error } = await c.supabase.from("course_videos").delete().eq("id", id).eq("course_id", courseId);
  if (error) back(P, "error", "Hata nahi paya");
  if (row?.storage_path) await c.supabase.storage.from(BUCKET).remove([row.storage_path]);
  await dropCovers(c, [row?.thumb_path]);
  await audit(c, "delete", "course_videos", id);
  refresh(paths(courseId));
  back(P, "ok", "Video hata diya ✓");
}

// Course hatate waqt uske upload kiye videos ki files bhi saaf (purane deleteCourse ki jagah ye use hota hai)
export async function deleteCourseWithVideos(formData: FormData) {
  const P = "/admin/courses";
  const c = await ctx();
  const id = s(formData, "id");
  if (!UUID.test(id)) back(P, "error", "Course nahi mila");
  const { data: vids } = await c.supabase.from("course_videos").select("storage_path, thumb_path, source").eq("course_id", id);
  const rows = (vids ?? []) as { storage_path: string | null; thumb_path: string | null; source: string }[];
  const files = rows.filter((v) => v.source === "upload").map((v) => v.storage_path).filter((p): p is string => !!p);
  const { data: cr } = await c.supabase.from("courses").select("cover_path").eq("id", id).maybeSingle();
  const { error } = await c.supabase.from("courses").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  if (files.length) await c.supabase.storage.from(BUCKET).remove(files);
  await dropCovers(c, [...rows.map((v) => v.thumb_path), (cr as { cover_path: string | null } | null)?.cover_path]);
  await audit(c, "delete", "courses", id);
  refresh(paths(id));
  back(P, "ok", "Course hata diya ✓");
}

// ================= Photos =================
// Photo browser se pehle hi bucket me upload ho chuki hoti hai. path=null matlab photo hatao.
export async function setCourseCover(courseId: string, path: string | null): Promise<{ error?: string }> {
  const c = await ctx();
  if (!UUID.test(courseId)) return { error: "Course nahi mila" };
  if (path !== null && !isCoverPath(path)) return { error: "Photo ka path galat hai" };
  const { error } = await c.supabase.from("courses").update({ cover_path: path }).eq("id", courseId);
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "update", "courses", courseId, { cover: path ? "set" : "removed" });
  refresh(paths(courseId));
  return {};
}

export async function setVideoThumb(courseId: string, videoId: string, path: string | null): Promise<{ error?: string }> {
  const c = await ctx();
  if (!UUID.test(courseId) || !UUID.test(videoId)) return { error: "Video nahi mila" };
  if (path !== null && !isCoverPath(path)) return { error: "Photo ka path galat hai" };
  const { error } = await c.supabase.from("course_videos").update({ thumb_path: path }).eq("id", videoId).eq("course_id", courseId);
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "update", "course_videos", videoId, { thumb: path ? "set" : "removed" });
  refresh(paths(courseId));
  return {};
}

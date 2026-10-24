"use server";
import { audit, back, ctx, dec, num, on, refresh, s } from "./helpers";
import { COVER_BUCKET, cleanMeta, isCoverPath, type BookMetaInput } from "@/lib/book-meta";
const okUrl = (u: string) => u === "" || /^https?:\/\//.test(u) || (u.startsWith("/") && !u.startsWith("//"));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ================= Book categories =================
export async function saveBookCategory(formData: FormData) {
  const P = "/admin/books";
  const c = await ctx();
  const name = s(formData, "name");
  if (name.length < 2) back(P, "error", "Category ka naam likho");
  const { error } = await c.supabase.from("book_categories").insert({ name });
  if (error) back(P, "error", error.message.includes("duplicate") ? "Ye Category pehle se hai" : "Save nahi hua");
  await audit(c, "create", "book_categories", null, { name });
  refresh([P, "/books"]);
  back(P, "ok", "Category ban gayi ✓");
}
export async function deleteBookCategory(formData: FormData) {
  const P = "/admin/books";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("book_categories").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "book_categories", id);
  refresh([P, "/books"]);
  back(P, "ok", "Category hata di (uski Books ab bina Category ki hain) ✓");
}

// ================= Books =================
// PDF browser se seedha Storage mein upload hoti hai (admin ke login se). Yahan sirf uski jaankari save hoti hai.
export async function createBook(input: { title: string; author: string; categoryId: string; storagePath: string; meta?: BookMetaInput }): Promise<{ error?: string }> {
  const c = await ctx();
  const title = input.title.trim();
  if (title.length < 2) return { error: "Title likho" };
  if (!/^[0-9a-f-]{36}\.pdf$/i.test(input.storagePath)) return { error: "File ka path galat hai" };
  const m = cleanMeta(input.meta ?? {});
  if (!m.ok) return { error: m.error };
  const { error } = await c.supabase.from("books").insert({
    title, author: input.author.trim(), category_id: UUID.test(input.categoryId) ? input.categoryId : null,
    storage_path: input.storagePath, created_by: c.profile.id, ...m.row,
  });
  if (error) return { error: `Save nahi hua: ${error.message}` };
  await audit(c, "create", "books", null, { title });
  await c.supabase.from("notifications").insert({ title: "Nayi Book aayi hai", body: title, kind: "book" });
  refresh(["/admin/books", "/books"]);
  return {};
}
export async function saveBook(formData: FormData) {
  const P = "/admin/books";
  const c = await ctx();
  const id = s(formData, "id");
  const title = s(formData, "title");
  if (title.length < 2) back(P, "error", "Title likho");
  const cat = s(formData, "category_id");
  const m = cleanMeta({
    description: s(formData, "description"), medium: s(formData, "medium"), publisher: s(formData, "publisher"),
    edition: s(formData, "edition"), exam: s(formData, "exam"), pages: s(formData, "pages"),
    year: s(formData, "published_year"), sizeMb: s(formData, "file_size_mb"),
  });
  if (!m.ok) return back(P, "error", m.error);
  const { error } = await c.supabase.from("books").update({
    title, author: s(formData, "author"), category_id: UUID.test(cat) ? cat : null, is_published: on(formData, "is_published"),
    ...m.row,
  }).eq("id", id);
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, "update", "books", id, { title });
  refresh([P, "/books"]);
  back(P, "ok", "Book save ho gayi ✓");
}
// Cover badalna (coverPath) ya hatana (null). Nayi file browser se pehle hi upload ho chuki hoti hai.
export async function setBookCover(id: string, coverPath: string | null): Promise<{ error?: string }> {
  const c = await ctx();
  if (!UUID.test(id)) return { error: "Book nahi mili" };
  if (coverPath !== null && !isCoverPath(coverPath)) return { error: "Cover ka path galat hai" };
  const { data: prev } = await c.supabase.from("books").select("cover_path").eq("id", id).maybeSingle();
  const old = (prev as { cover_path: string | null } | null)?.cover_path ?? null;
  const { error } = await c.supabase.from("books").update({ cover_path: coverPath }).eq("id", id);
  if (error) return { error: `Save nahi hua: ${error.message}` };
  if (old && old !== coverPath) await c.supabase.storage.from(COVER_BUCKET).remove([old]);
  await audit(c, "update", "books", id, { cover: coverPath ? "set" : "removed" });
  refresh(["/admin/books", "/books"]);
  return {};
}
export async function deleteBook(formData: FormData) {
  const P = "/admin/books";
  const c = await ctx();
  const id = s(formData, "id");
  const { data } = await c.supabase.from("books").select("storage_path, cover_path").eq("id", id).maybeSingle();
  const row = data as { storage_path: string | null; cover_path: string | null } | null;
  const { error } = await c.supabase.from("books").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  if (row?.storage_path) await c.supabase.storage.from("books").remove([row.storage_path]);
  if (row?.cover_path) await c.supabase.storage.from(COVER_BUCKET).remove([row.cover_path]);
  await audit(c, "delete", "books", id);
  refresh([P, "/books"]);
  back(P, "ok", "Book aur PDF hata di ✓");
}

// ================= Test categories / Tests =================
export async function saveTestCategory(formData: FormData) {
  const P = "/admin/tests";
  const c = await ctx();
  const name = s(formData, "name");
  if (name.length < 2) back(P, "error", "Pariksha ka naam likho");
  const { error } = await c.supabase.from("test_categories").insert({ name });
  if (error) back(P, "error", error.message.includes("duplicate") ? "Ye pehle se hai" : "Save nahi hua");
  await audit(c, "create", "test_categories", null, { name });
  refresh([P, "/mock-tests"]);
  back(P, "ok", "Pariksha jod di ✓");
}
export async function saveTest(formData: FormData) {
  const P = "/admin/tests";
  const c = await ctx();
  const id = s(formData, "id");
  const title = s(formData, "title");
  const minutes = num(formData, "duration_minutes");
  if (title.length < 3) back(P, "error", "Title kam se kam 3 akshar ka ho");
  if (minutes < 1 || minutes > 600) back(P, "error", "Time 1 se 600 minute ke beech ho");
  const cat = s(formData, "category_id");
  const row = {
    title, description: s(formData, "description"), duration_minutes: minutes,
    category_id: UUID.test(cat) ? cat : null, is_published: on(formData, "is_published"),
  };
  if (id) {
    const { data: prev } = await c.supabase.from("mock_tests").select("is_published").eq("id", id).maybeSingle();
    const { error } = await c.supabase.from("mock_tests").update(row).eq("id", id);
    if (error) back(P, "error", `Save nahi hua: ${error.message}`);
    await audit(c, "update", "mock_tests", id, { title });
    if (row.is_published && !(prev as { is_published: boolean } | null)?.is_published) await c.supabase.from("notifications").insert({ title: "Naya Mock Test aaya hai", body: title, kind: "test" });
    refresh([P, "/mock-tests"]);
    back(`${P}/${id}`, "ok", "Test save ho gaya ✓");
  }
  const { data, error } = await c.supabase.from("mock_tests").insert({ ...row, created_by: c.profile.id }).select("id").single();
  if (error || !data) back(P, "error", `Save nahi hua: ${error?.message ?? ""}`);
  const newId = (data as { id: string }).id;
  await audit(c, "create", "mock_tests", newId, { title });
  if (row.is_published) await c.supabase.from("notifications").insert({ title: "Naya Mock Test aaya hai", body: title, kind: "test" });
  refresh([P, "/mock-tests"]);
  back(`${P}/${newId}`, "ok", "Test ban gaya. Ab Sawal jodo ✓");
}
export async function deleteTest(formData: FormData) {
  const P = "/admin/tests";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("mock_tests").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "mock_tests", id);
  refresh([P, "/mock-tests"]);
  back(P, "ok", "Test hata diya ✓");
}

// ================= Questions =================
export async function saveQuestion(formData: FormData) {
  const testId = s(formData, "test_id");
  const P = `/admin/tests/${testId}`;
  const c = await ctx();
  if (!UUID.test(testId)) back("/admin/tests", "error", "Test nahi mila");
  const id = s(formData, "id");
  const text = s(formData, "question_text");
  const options = [1, 2, 3, 4].map((i) => s(formData, `opt${i}`)).filter(Boolean);
  const correct = num(formData, "correct") - 1; // 1-4 -> 0-3
  if (text.length < 3) back(P, "error", "Sawal likho");
  if (options.length < 2) back(P, "error", "Kam se kam 2 Options chahiye");
  if (correct < 0 || correct >= options.length) back(P, "error", "Sahi uttar un Options mein se chuno jo bhare hain");
  const marks = dec(formData, "marks", 1);
  const neg = dec(formData, "negative_marks", 0);
  if (marks <= 0 || neg < 0) back(P, "error", "Marks sahi daalo");
  const row = {
    question_text: text, options, correct_index: correct, marks, negative_marks: neg,
    explanation: s(formData, "explanation"), sort_order: num(formData, "sort_order"),
    subject: s(formData, "subject").slice(0, 30) || null,
  };
  const { error } = id
    ? await c.supabase.from("questions").update(row).eq("id", id).eq("test_id", testId)
    : await c.supabase.from("questions").insert({ ...row, test_id: testId });
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "questions", id || null, { testId });
  refresh([P, "/admin/tests"]);
  back(P, "ok", "Sawal save ho gaya ✓");
}
export async function deleteQuestion(formData: FormData) {
  const testId = s(formData, "test_id");
  const P = `/admin/tests/${testId}`;
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("questions").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "questions", id, { testId });
  refresh([P, "/admin/tests"]);
  back(P, "ok", "Sawal hata diya ✓");
}

// ================= Support reports =================
export async function deleteReport(formData: FormData) {
  const P = "/admin/reports";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("support_reports").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "support_reports", id);
  refresh([P]);
  back(P, "ok", "Report hata di ✓");
}

// ================= Courses =================
export async function saveCourse(formData: FormData) {
  const P = "/admin/courses";
  const c = await ctx();
  const id = s(formData, "id");
  const title = s(formData, "title");
  const url = s(formData, "url");
  if (title.length < 2) back(P, "error", "Course ka naam likho");
  if (!okUrl(url)) back(P, "error", "Link https:// se ya / se shuru hona chahiye");
  const row = {
    title: title.slice(0, 120), description: s(formData, "description").slice(0, 500), category: s(formData, "category").slice(0, 40),
    url: url || null, sort_order: num(formData, "sort_order"), is_published: on(formData, "is_published"),
  };
  const { error } = id
    ? await c.supabase.from("courses").update(row).eq("id", id)
    : await c.supabase.from("courses").insert({ ...row, created_by: c.profile.id });
  if (error) back(P, "error", `Save nahi hua: ${error.message}`);
  await audit(c, id ? "update" : "create", "courses", id || null, { title });
  refresh([P, "/courses"]);
  back(P, "ok", "Course save ho gaya ✓");
}
export async function deleteCourse(formData: FormData) {
  const P = "/admin/courses";
  const c = await ctx();
  const id = s(formData, "id");
  const { error } = await c.supabase.from("courses").delete().eq("id", id);
  if (error) back(P, "error", "Hata nahi paya");
  await audit(c, "delete", "courses", id);
  refresh([P, "/courses"]);
  back(P, "ok", "Course hata diya ✓");
}

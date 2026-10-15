import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth";
import type { DayLog, Goal, MiniTask, StudyInput } from "@/lib/study-stats";

export type NotifyPrefs = { new_content: boolean; daily_reminder: boolean; goal_reminder: boolean };
export type FullProfile = {
  id: string; email: string; emailVerified: boolean; lastSignIn: string | null; createdAt: string; provider: string;
  role: "student" | "admin"; fullName: string; phone: string; targetExam: string; examDate: string | null;
  subjects: string[]; dailyGoal: number; avatarUrl: string | null; hasAvatar: boolean; prefs: NotifyPrefs;
};

const DEFAULT_PREFS: NotifyPrefs = { new_content: true, daily_reminder: false, goal_reminder: false };

export const getFullProfile = cache(async (): Promise<FullProfile | null> => {
  const [user, row] = await Promise.all([getUser(), getProfile()]);
  if (!user || !row) return null;
  const r = row as unknown as Record<string, unknown>;
  const path = typeof r.avatar_path === "string" ? r.avatar_path : null;
  let avatarUrl: string | null = null;
  if (path) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }
  const p = (r.notify_prefs ?? {}) as Partial<NotifyPrefs>;
  return {
    id: user.id, email: user.email ?? "", emailVerified: Boolean(user.email_confirmed_at), lastSignIn: user.last_sign_in_at ?? null,
    createdAt: user.created_at, provider: String(user.app_metadata?.provider ?? "email"), role: row.role,
    fullName: row.full_name, phone: typeof r.phone === "string" ? r.phone : "", targetExam: typeof r.target_exam === "string" ? r.target_exam : "",
    examDate: typeof r.exam_date === "string" ? r.exam_date : null, subjects: Array.isArray(r.favorite_subjects) ? (r.favorite_subjects as string[]) : [],
    dailyGoal: typeof r.daily_goal_minutes === "number" ? r.daily_goal_minutes : 120, avatarUrl, hasAvatar: Boolean(path),
    prefs: { ...DEFAULT_PREFS, ...p },
  };
});

function parse<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// Task page ka data (user_task_data) -> dashboard ka input
export async function getStudyData(userId: string): Promise<StudyInput> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_task_data").select("data").eq("user_id", userId).maybeSingle();
  const d = ((data as { data: Record<string, string> } | null)?.data) ?? {};
  const rawTasks = parse<Record<string, unknown>[]>(d["studyUniverse.tasks.v1"]);
  const tasks: MiniTask[] = (Array.isArray(rawTasks) ? rawTasks : [])
    .filter((t) => t && typeof t.start === "number" && typeof t.end === "number")
    .map((t) => ({ id: t.id as number | string, start: t.start as number, end: t.end as number, title: String(t.title ?? ""), type: String(t.type ?? ""), subject: typeof t.subject === "string" ? t.subject : undefined }));
  const done = parse<{ date?: string; ids?: (number | string)[] }>(d["studyUniverse.done.v1"]);
  const hist = parse<Record<string, number>>(d["studyUniverse.hist.v1"]) ?? {};
  const log = parse<Record<string, DayLog>>(d["studyUniverse.log.v1"]) ?? {};
  return {
    // Agar user ne Task page kabhi nahi kholi to default 24 Tasks maane jaate hain (wahi jo Task page dikhata hai)
    tasks, hist, log,
    done: done && typeof done.date === "string" && Array.isArray(done.ids) ? { date: done.date, ids: done.ids } : null,
  };
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_goals").select("*").order("created_at");
  return (data ?? []) as Goal[];
}

export type AttemptRow = { id: string; testId: string; title: string; score: number; total: number; pct: number; at: string };
export type OpenAttempt = { id: string; testId: string; title: string; startedAt: string };
export type SubjectStat = { subject: string; correct: number; wrong: number; skipped: number };

export async function getTestsOverview(): Promise<{ submitted: AttemptRow[]; open: OpenAttempt[]; subjects: SubjectStat[] }> {
  const supabase = await createClient();
  const [a, o, s] = await Promise.all([
    supabase.from("test_attempts").select("id,test_id,score,submitted_at,mock_tests(title,total_marks)").eq("status", "submitted").order("submitted_at", { ascending: false }).limit(50),
    supabase.from("test_attempts").select("id,test_id,started_at,mock_tests(title)").eq("status", "in_progress").order("started_at", { ascending: false }).limit(10),
    supabase.rpc("my_subject_stats"),
  ]);
  type A = { id: string; test_id: string; score: number | null; submitted_at: string | null; mock_tests: { title: string; total_marks: number } | null };
  type O = { id: string; test_id: string; started_at: string; mock_tests: { title: string } | null };
  const submitted = ((a.data ?? []) as unknown as A[]).map((x) => {
    const total = x.mock_tests?.total_marks ?? 0;
    const score = x.score ?? 0;
    return { id: x.id, testId: x.test_id, title: x.mock_tests?.title ?? "Test", score, total, pct: total > 0 ? Math.max(0, Math.min(100, (score / total) * 100)) : 0, at: x.submitted_at ?? "" };
  });
  const open = ((o.data ?? []) as unknown as O[]).map((x) => ({ id: x.id, testId: x.test_id, title: x.mock_tests?.title ?? "Test", startedAt: x.started_at }));
  const subjects = ((s.data ?? []) as { subject: string; correct: number; wrong: number; skipped: number }[]).map((x) => ({ subject: x.subject, correct: Number(x.correct), wrong: Number(x.wrong), skipped: Number(x.skipped) }));
  return { submitted, open, subjects };
}

export type BookLite = { id: string; title: string; author: string };

export async function getLearning(): Promise<{ saved: BookLite[]; recent: (BookLite & { at: string })[] }> {
  const supabase = await createClient();
  const [b, r] = await Promise.all([
    supabase.from("bookmarks").select("item_id").eq("item_type", "book").order("created_at", { ascending: false }).limit(50),
    supabase.from("user_book_activity").select("last_opened_at,books(id,title,author)").order("last_opened_at", { ascending: false }).limit(8),
  ]);
  const ids = ((b.data ?? []) as { item_id: string }[]).map((x) => x.item_id);
  let saved: BookLite[] = [];
  if (ids.length) {
    const { data } = await supabase.from("books").select("id,title,author").in("id", ids).eq("is_published", true);
    const map = new Map(((data ?? []) as BookLite[]).map((x) => [x.id, x]));
    saved = ids.map((id) => map.get(id)).filter((x): x is BookLite => Boolean(x));
  }
  const recent = ((r.data ?? []) as unknown as { last_opened_at: string; books: BookLite | null }[])
    .filter((x) => x.books).map((x) => ({ ...(x.books as BookLite), at: x.last_opened_at }));
  return { saved, recent };
}

export type Notif = { id: string; title: string; body: string; kind: string; at: string; read: boolean };

export async function getNotifications(prefs: NotifyPrefs): Promise<Notif[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id,title,body,kind,created_at").order("created_at", { ascending: false }).limit(40);
  const rows = (data ?? []) as { id: string; title: string; body: string; kind: string; created_at: string }[];
  if (!rows.length) return [];
  const { data: rd } = await supabase.from("notification_reads").select("notification_id").in("notification_id", rows.map((x) => x.id));
  const read = new Set(((rd ?? []) as { notification_id: string }[]).map((x) => x.notification_id));
  return rows
    .filter((x) => prefs.new_content || (x.kind !== "book" && x.kind !== "test"))
    .map((x) => ({ id: x.id, title: x.title, body: x.body, kind: x.kind, at: x.created_at, read: read.has(x.id) }));
}

// Sabhi submit kiye tests ke jawab: kitne sahi, kitne galat (sirf apne, RLS se)
export async function getAccuracy(): Promise<{ correct: number; wrong: number }> {
  const supabase = await createClient();
  const [c, w] = await Promise.all([
    supabase.from("attempt_answers").select("question_id", { count: "exact", head: true }).eq("is_correct", true),
    supabase.from("attempt_answers").select("question_id", { count: "exact", head: true }).eq("is_correct", false),
  ]);
  return { correct: c.count ?? 0, wrong: w.count ?? 0 };
}

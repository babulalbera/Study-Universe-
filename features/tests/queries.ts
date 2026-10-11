import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PublicQuestion, TestListItem } from "./types";

type Row = { id: string; title: string; description: string; duration_minutes: number; total_marks: number; test_categories: { name: string } | null };
const toItem = (r: Row): TestListItem => ({
  id: r.id, title: r.title, description: r.description, duration_minutes: r.duration_minutes,
  total_marks: r.total_marks, category: r.test_categories?.name ?? null,
});
const COLS = "id,title,description,duration_minutes,total_marks,test_categories(name)";

export async function getPublishedTests(): Promise<TestListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("mock_tests").select(COLS).eq("is_published", true).order("created_at", { ascending: false }).limit(60);
  return ((data ?? []) as unknown as Row[]).map(toItem);
}

export async function getTest(id: string): Promise<TestListItem | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("mock_tests").select(COLS).eq("id", id).eq("is_published", true).maybeSingle();
  return data ? toItem(data as unknown as Row) : null;
}

// Chal raha attempt + bacha hua time (server ki ghadi se)
export async function getOpenAttempt(testId: string, durationMinutes: number): Promise<{ id: string; remainingSeconds: number } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("test_attempts").select("id,started_at").eq("test_id", testId).eq("status", "in_progress")
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const a = data as { id: string; started_at: string };
  const elapsed = Math.floor((Date.now() - new Date(a.started_at).getTime()) / 1000);
  return { id: a.id, remainingSeconds: Math.max(0, durationMinutes * 60 - elapsed) };
}

export async function getTestQuestions(testId: string): Promise<PublicQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_test_questions", { p_test_id: testId });
  return (data ?? []) as PublicQuestion[];
}

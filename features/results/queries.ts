import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AttemptRow = { id: string; score: number | null; submitted_at: string | null; mock_tests: { title: string; total_marks: number } | null };
export type ReviewRow = {
  question_id: string; question_text: string; options: string[]; selected_index: number | null;
  correct_index: number; is_correct: boolean | null; marks: number; explanation: string;
};

export async function getMyAttempts(): Promise<AttemptRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("test_attempts").select("id,score,submitted_at,mock_tests(title,total_marks)")
    .eq("status", "submitted").order("submitted_at", { ascending: false }).limit(50);
  return (data ?? []) as unknown as AttemptRow[];
}

export async function getAttempt(id: string): Promise<AttemptRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("test_attempts").select("id,score,submitted_at,mock_tests(title,total_marks)")
    .eq("id", id).eq("status", "submitted").maybeSingle();
  return (data as unknown as AttemptRow | null) ?? null;
}

export async function getAttemptReview(id: string): Promise<ReviewRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_attempt_review", { p_attempt_id: id });
  return (data ?? []) as ReviewRow[];
}

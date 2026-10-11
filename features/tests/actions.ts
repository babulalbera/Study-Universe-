"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function startTest(formData: FormData) {
  const testId = String(formData.get("test_id") ?? "");
  if (!UUID.test(testId)) redirect("/mock-tests");
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/mock-tests/${testId}`)}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_attempt", { p_test_id: testId });
  if (error) redirect("/mock-tests");
  redirect(`/mock-tests/${testId}`);
}

// Scoring database function karta hai; browser se sirf jawab jate hain.
export async function submitAttempt(attemptId: string, answers: Record<string, number>): Promise<{ error: string }> {
  if (!UUID.test(attemptId)) return { error: "Attempt galat hai" };
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (UUID.test(k) && Number.isInteger(v) && v >= 0 && v < 10) clean[k] = v;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_attempt", { p_attempt_id: attemptId, p_answers: clean });
  if (error) return { error: "Submit nahi ho paya. Internet dekho aur dobara dabao." };
  redirect(`/results/${attemptId}`);
}

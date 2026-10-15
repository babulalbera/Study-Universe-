import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Sirf login user ka apna data (RLS bhi sirf apni rows deti hai). JSON file download hoti hai.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const supabase = await createClient();
  const [profile, taskData, attempts, goals, bookmarks, activity, reads, reports] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_task_data").select("data,updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("test_attempts").select("*, attempt_answers(question_id,selected_index,is_correct)").eq("user_id", user.id),
    supabase.from("user_goals").select("*").eq("user_id", user.id),
    supabase.from("bookmarks").select("*").eq("user_id", user.id),
    supabase.from("user_book_activity").select("*").eq("user_id", user.id),
    supabase.from("notification_reads").select("*").eq("user_id", user.id),
    supabase.from("support_reports").select("*").eq("user_id", user.id),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile.data, taskPageData: taskData.data, testAttempts: attempts.data, goals: goals.data,
    bookmarks: bookmarks.data, recentBooks: activity.data, readNotifications: reads.data, reports: reports.data,
    note: "Cover photos Task page ke tumhare phone ki local storage mein hoti hain, isliye is file mein nahi.",
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="study-universe-my-data.json"',
      "Cache-Control": "private, no-store",
    },
  });
}

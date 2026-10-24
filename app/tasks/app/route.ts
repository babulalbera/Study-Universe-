import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getSiteSettings } from "@/features/home/queries";
import { renderTaskPage } from "@/lib/task-page";

export const dynamic = "force-dynamic";

// Task app ka andar ka hissa. Ise seedha mat kholo: /tasks page ise apne andar dikhata hai
// (Header, Krishna boxes, Bottom bar sab baaki website jaisa). Login user ka apna data; guest ka phone ki memory me.
export async function GET() {
  const user = await getUser();
  let boot: { mode: "server" | "local"; uid?: string; data?: Record<string, string> } = { mode: "local" };
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("user_task_data").select("data").eq("user_id", user.id).maybeSingle();
    boot = { mode: "server", uid: user.id, data: ((data as { data: Record<string, string> } | null)?.data) ?? {} };
  }
  const settings = await getSiteSettings();
  const ctx = { loggedIn: Boolean(user), courseHref: settings.course_url || "/courses" };
  return new Response(renderTaskPage(boot, ctx, { embed: true }), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}

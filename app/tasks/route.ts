import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth";
import { getHomeCards, getHomeSocials } from "@/features/home/queries";
import { renderTaskPage } from "@/lib/task-page";

export const dynamic = "force-dynamic";

// /tasks = poora apna Page. Login user ka apna data (har user ka alag); login nahi to phone ki memory.
export async function GET() {
  const user = await getUser();
  let boot: { mode: "server" | "local"; data?: Record<string, string> } = { mode: "local" };
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("user_task_data").select("data").eq("user_id", user.id).maybeSingle();
    boot = { mode: "server", data: ((data as { data: Record<string, string> } | null)?.data) ?? {} };
  }
  const [profile, cards, socials] = await Promise.all([getProfile(), getHomeCards(), getHomeSocials()]);
  const ctx = {
    loggedIn: Boolean(user),
    name: profile?.full_name || user?.email?.split("@")[0] || "Guest",
    courseHref: cards.find((c) => c.key === "free")?.href ?? null,
    socials: socials.map((x) => ({ key: x.key, name: x.name, href: x.href })),
  };
  return new Response(renderTaskPage(boot, ctx), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

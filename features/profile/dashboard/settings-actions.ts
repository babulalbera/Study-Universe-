"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

// Notifications ON/OFF: teeno pasand (naya content, daily, goal) ek saath
export async function setNotifAll(on: boolean): Promise<{ ok: boolean; error?: string }> {
  if (typeof on !== "boolean") return { ok: false, error: "Galat value" };
  const user = await getUser();
  if (!user) return { ok: false, error: "Pehle login karo" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles")
    .update({ notify_prefs: { new_content: on, daily_reminder: on, goal_reminder: on } }).eq("id", user.id);
  if (error) return { ok: false, error: "Save nahi ho paya" };
  revalidatePath("/profile");
  return { ok: true };
}

// Sirf is device ka nahi, normal Log Out
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

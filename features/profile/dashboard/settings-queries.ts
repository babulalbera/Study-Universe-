import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getMyBio(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("bio").eq("id", userId).maybeSingle();
  const b = (data as { bio?: unknown } | null)?.bio;
  return typeof b === "string" ? b : "";
}

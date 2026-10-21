"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { FormState } from "../types";

// Profile card ka chhota quote (bio): sirf text, 120 akshar tak
export async function updateBio(_p: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Pehle Login karo." };
  const bio = String(f.get("bio") ?? "").replace(/\s+/g, " ").trim();
  if (bio.length > 120) return { fieldErrors: { bio: "Bio 120 akshar se chhoti ho" } };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ bio: bio || null }).eq("id", user.id);
  if (error) return { error: "Save nahi ho paya. Dobara koshish karo." };
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { message: "Bio save ho gayi ✓" };
}

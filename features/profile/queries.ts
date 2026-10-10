import "server-only";
import { getProfile, getUser } from "@/lib/auth";

export type ProfileData = { id: string; name: string; email: string; role: "student" | "admin" };

export async function getCurrentProfile(): Promise<ProfileData | null> {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return { id: user.id, name: profile.full_name, email: user.email ?? "", role: profile.role };
}

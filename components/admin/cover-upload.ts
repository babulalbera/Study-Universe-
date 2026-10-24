import { createClient } from "@/lib/supabase/client";
import { COVER_BUCKET, COVER_EXT, COVER_MAX_MB } from "@/lib/book-meta";

// Browser se seedha Storage me cover upload (admin ke login se). Sirf client components se bulao.
export function checkCover(file: File): string | null {
  if (!COVER_EXT[file.type]) return "Cover sirf JPG, PNG ya WebP ho";
  if (file.size > COVER_MAX_MB * 1024 * 1024) return `Cover ${COVER_MAX_MB}MB se chhota ho`;
  return null;
}

export async function uploadCover(file: File): Promise<{ path?: string; error?: string }> {
  const bad = checkCover(file);
  if (bad) return { error: bad };
  const path = `${crypto.randomUUID()}.${COVER_EXT[file.type]}`;
  const { error } = await createClient().storage.from(COVER_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  return error ? { error: `Cover upload nahi hua: ${error.message}` } : { path };
}

export async function removeCover(path: string): Promise<void> {
  await createClient().storage.from(COVER_BUCKET).remove([path]);
}

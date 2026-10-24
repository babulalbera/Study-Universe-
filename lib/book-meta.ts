// Book ki extra jaankari (cover, medium, publisher...) ki jaanch aur helpers.
// Server aur browser dono jagah chalta hai, isliye "server-only" nahi lagaya.
export const MEDIUMS = ["hindi", "english", "bilingual"] as const;
export type BookMedium = (typeof MEDIUMS)[number];

export const MEDIUM_LABEL: Record<BookMedium, string> = {
  hindi: "हिंदी",
  english: "English",
  bilingual: "Hindi + English",
};

export const COVER_BUCKET = "book-covers";
export const COVER_MAX_MB = 2;
export const COVER_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const COVER_PATH = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i;

// Cover ka public URL (bucket public hai, isliye signed URL nahi chahiye)
export function coverUrl(path?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base || !COVER_PATH.test(path)) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${COVER_BUCKET}/${path}`;
}

export function isCoverPath(path: string): boolean {
  return COVER_PATH.test(path);
}

export type BookMetaInput = {
  description?: string;
  medium?: string;
  publisher?: string;
  edition?: string;
  exam?: string;
  pages?: string | number;
  year?: string | number;
  sizeMb?: string | number;
  coverPath?: string; // undefined = cover ko mat chhedo, "" = cover hatao
};

export type BookMetaRow = {
  description: string;
  medium: BookMedium | null;
  publisher: string | null;
  edition: string | null;
  exam: string | null;
  pages: number | null;
  published_year: number | null;
  file_size_mb: number | null;
  cover_path?: string | null;
};

export type MetaResult = { ok: true; row: BookMetaRow } | { ok: false; error: string };

const text = (v: string | undefined, max: number): string | null => {
  const x = (v ?? "").trim().slice(0, max);
  return x || null;
};

export function cleanMeta(i: BookMetaInput): MetaResult {
  const medium = (i.medium ?? "").trim();
  if (medium && !(MEDIUMS as readonly string[]).includes(medium)) return { ok: false, error: "Medium sahi chuno" };

  const pagesRaw = String(i.pages ?? "").trim();
  let pages: number | null = null;
  if (pagesRaw) {
    const n = Number(pagesRaw);
    if (!Number.isInteger(n) || n < 1 || n > 10000) return { ok: false, error: "Pages 1 se 10000 ke beech ka poora number ho" };
    pages = n;
  }

  const yearRaw = String(i.year ?? "").trim();
  let published_year: number | null = null;
  if (yearRaw) {
    const n = Number(yearRaw);
    if (!Number.isInteger(n) || n < 1900 || n > 2100) return { ok: false, error: "Year 1900 se 2100 ke beech ho (jaise 2023)" };
    published_year = n;
  }

  const sizeRaw = String(i.sizeMb ?? "").trim();
  let file_size_mb: number | null = null;
  if (sizeRaw) {
    const n = Number(sizeRaw);
    if (!Number.isFinite(n) || n <= 0 || n > 2000) return { ok: false, error: "File size MB me sahi daalo (jaise 46.7)" };
    file_size_mb = Math.round(n * 10) / 10;
  }

  const cover = i.coverPath?.trim();
  if (cover && !COVER_PATH.test(cover)) return { ok: false, error: "Cover ka path galat hai" };

  const row: BookMetaRow = {
    description: (i.description ?? "").trim().slice(0, 500),
    medium: (medium || null) as BookMedium | null,
    publisher: text(i.publisher, 80),
    edition: text(i.edition, 40),
    exam: text(i.exam, 60),
    pages,
    published_year,
    file_size_mb,
  };
  if (i.coverPath !== undefined) row.cover_path = cover || null;
  return { ok: true, row };
}

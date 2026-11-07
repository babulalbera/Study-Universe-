-- Phase 15: Course ki cover photo aur Video ki thumbnail
-- Photos purane public bucket "book-covers" me jaati hain (usi ki policies chalti hain).

alter table public.courses
  add column if not exists cover_path text
  check (cover_path is null or cover_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$');

alter table public.course_videos
  add column if not exists thumb_path text
  check (thumb_path is null or thumb_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$');

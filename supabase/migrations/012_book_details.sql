-- Book details: cover image, medium, publisher, edition, exam. Supabase SQL Editor me chalao. Dobara chalane par bhi safe.
-- (description, author, pages columns pehle se books table me hain.)

alter table public.books
  add column if not exists cover_path text,
  add column if not exists medium text,
  add column if not exists publisher text,
  add column if not exists edition text,
  add column if not exists exam text;

alter table public.books drop constraint if exists books_medium_valid;
alter table public.books add constraint books_medium_valid
  check (medium is null or medium in ('hindi','english','bilingual'));

alter table public.books drop constraint if exists books_cover_path_valid;
alter table public.books add constraint books_cover_path_valid
  check (cover_path is null or cover_path ~* '^[0-9a-f-]{36}\.(jpg|png|webp)$');

alter table public.books drop constraint if exists books_publisher_len;
alter table public.books add constraint books_publisher_len check (publisher is null or char_length(publisher) <= 80);

alter table public.books drop constraint if exists books_edition_len;
alter table public.books add constraint books_edition_len check (edition is null or char_length(edition) <= 40);

alter table public.books drop constraint if exists books_exam_len;
alter table public.books add constraint books_exam_len check (exam is null or char_length(exam) <= 60);

-- "not valid" => purani rows par jaanch nahi, sirf nayi/badli rows par
alter table public.books drop constraint if exists books_pages_valid;
alter table public.books add constraint books_pages_valid
  check (pages is null or pages between 1 and 10000) not valid;

-- Cover images ka public bucket (cover koi secret nahi, isliye bina login ke dikhta hai). Max 2 MB, sirf JPG/PNG/WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "book covers public read" on storage.objects;
drop policy if exists "book covers admin write" on storage.objects;
drop policy if exists "book covers admin update" on storage.objects;
drop policy if exists "book covers admin delete" on storage.objects;

create policy "book covers public read" on storage.objects for select using (bucket_id = 'book-covers');
create policy "book covers admin write" on storage.objects for insert to authenticated with check (bucket_id = 'book-covers' and public.is_admin());
create policy "book covers admin update" on storage.objects for update to authenticated using (bucket_id = 'book-covers' and public.is_admin());
create policy "book covers admin delete" on storage.objects for delete to authenticated using (bucket_id = 'book-covers' and public.is_admin());

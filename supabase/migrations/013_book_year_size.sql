-- Book ka Year aur File Size (MB). Supabase SQL Editor me chalao (012 ke baad). Dobara chalane par bhi safe.
alter table public.books
  add column if not exists published_year smallint,
  add column if not exists file_size_mb numeric(7,1);

alter table public.books drop constraint if exists books_published_year_valid;
alter table public.books add constraint books_published_year_valid
  check (published_year is null or published_year between 1900 and 2100);

alter table public.books drop constraint if exists books_file_size_valid;
alter table public.books add constraint books_file_size_valid
  check (file_size_mb is null or (file_size_mb > 0 and file_size_mb <= 2000));

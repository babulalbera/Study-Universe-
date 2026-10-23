-- Books ko external link (Drive, Mega, Dropbox, ...) se bhi add karne ke liye. Supabase SQL Editor mein chalao.
alter table public.books
  add column if not exists external_url text,
  add column if not exists link_source text;

alter table public.books drop constraint if exists books_external_url_https;
alter table public.books
  add constraint books_external_url_https check (external_url is null or external_url ~* '^https://');

alter table public.books drop constraint if exists books_link_source_valid;
alter table public.books
  add constraint books_link_source_valid
  check (link_source is null or link_source in ('drive','mega','dropbox','onedrive','mediafire','telegram','other'));

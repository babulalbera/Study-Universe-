-- Phase 8: Courses (Bottom Bar ka "Courses" aur Profile ka "Courses" tile asli page par khule)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 500),
  category text not null default '' check (char_length(category) <= 40),
  url text check (url is null or url ~ '^(https?://|/)'),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_list_idx on public.courses (sort_order, created_at desc) where is_published;
alter table public.courses enable row level security;
drop policy if exists "public read" on public.courses;
drop policy if exists "admin all" on public.courses;
create policy "public read" on public.courses for select using (is_published);
create policy "admin all" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses for each row execute function public.set_updated_at();

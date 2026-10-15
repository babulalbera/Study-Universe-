-- Phase 7: Student Dashboard (Profile). Dobara chalane par bhi safe (idempotent).

-- ===== profiles: naye fields =====
alter table public.profiles
  add column if not exists phone text,
  add column if not exists target_exam text,
  add column if not exists exam_date date,
  add column if not exists favorite_subjects text[] not null default '{}',
  add column if not exists daily_goal_minutes int,
  add column if not exists avatar_path text,
  add column if not exists notify_prefs jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_phone_chk;
alter table public.profiles add constraint profiles_phone_chk check (phone is null or phone ~ '^[0-9+() -]{7,20}$');
alter table public.profiles drop constraint if exists profiles_goal_chk;
alter table public.profiles add constraint profiles_goal_chk check (daily_goal_minutes is null or daily_goal_minutes between 15 and 1440);
alter table public.profiles drop constraint if exists profiles_exam_chk;
alter table public.profiles add constraint profiles_exam_chk check (target_exam is null or char_length(target_exam) <= 40);
alter table public.profiles drop constraint if exists profiles_subjects_chk;
alter table public.profiles add constraint profiles_subjects_chk check (cardinality(favorite_subjects) <= 8);
alter table public.profiles drop constraint if exists profiles_avatar_chk;
alter table public.profiles add constraint profiles_avatar_chk check (avatar_path is null or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$'));

-- ===== avatars: PRIVATE bucket (har user sirf apna folder <user_id>/) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "avatars own read" on storage.objects;
drop policy if exists "avatars own insert" on storage.objects;
drop policy if exists "avatars own update" on storage.objects;
drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== user_goals =====
create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  period text not null check (period in ('daily','weekly','monthly')),
  metric text not null check (metric in ('tasks','minutes')),
  target int not null check (target between 1 and 100000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_goals_user_idx on public.user_goals (user_id, created_at);
alter table public.user_goals enable row level security;
drop policy if exists "own all" on public.user_goals;
create policy "own all" on public.user_goals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists user_goals_updated_at on public.user_goals;
create trigger user_goals_updated_at before update on public.user_goals for each row execute function public.set_updated_at();

-- ===== user_book_activity (haal hi mein kholi gayi books) =====
create table if not exists public.user_book_activity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  last_opened_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index if not exists user_book_activity_recent_idx on public.user_book_activity (user_id, last_opened_at desc);
alter table public.user_book_activity enable row level security;
drop policy if exists "own all" on public.user_book_activity;
create policy "own all" on public.user_book_activity for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== notifications: kind + har user ka read-status =====
alter table public.notifications add column if not exists kind text not null default 'info';
create table if not exists public.notification_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);
alter table public.notification_reads enable row level security;
drop policy if exists "own all" on public.notification_reads;
create policy "own all" on public.notification_reads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== support_reports =====
create table if not exists public.support_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('bug','content','account','other')),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists support_reports_user_idx on public.support_reports (user_id, created_at desc);
alter table public.support_reports enable row level security;
drop policy if exists "own insert" on public.support_reports;
drop policy if exists "own read" on public.support_reports;
drop policy if exists "admin all" on public.support_reports;
create policy "own insert" on public.support_reports for insert to authenticated with check (user_id = auth.uid());
create policy "own read" on public.support_reports for select to authenticated using (user_id = auth.uid());
create policy "admin all" on public.support_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===== questions.subject + subject-wise test stats (sirf apne attempts) =====
alter table public.questions add column if not exists subject text check (subject is null or char_length(subject) <= 30);

create or replace function public.my_subject_stats()
returns table (subject text, correct bigint, wrong bigint, skipped bigint)
language sql stable security definer set search_path = public as $$
  select q.subject,
         count(*) filter (where aa.is_correct is true),
         count(*) filter (where aa.is_correct is false),
         count(*) filter (where aa.is_correct is null)
  from public.attempt_answers aa
  join public.test_attempts a on a.id = aa.attempt_id and a.user_id = auth.uid() and a.status = 'submitted'
  join public.questions q on q.id = aa.question_id
  where q.subject is not null and q.subject <> ''
  group by q.subject
  order by q.subject;
$$;
revoke all on function public.my_subject_stats() from public, anon;
grant execute on function public.my_subject_stats() to authenticated;

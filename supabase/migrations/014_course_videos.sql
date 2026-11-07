-- Phase 14: Course ke andar Folders aur Videos
-- Run karna: Supabase Dashboard -> SQL Editor -> paste -> Run

-- ================= Folders =================
create table if not exists public.course_folders (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_folders_course_idx on public.course_folders (course_id, sort_order, created_at);

-- ================= Videos =================
-- source: youtube | drive | mega | direct (seedha .mp4 link) | upload (Supabase Storage)
create table if not exists public.course_videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  folder_id uuid references public.course_folders(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 150),
  description text not null default '' check (char_length(description) <= 500),
  source text not null check (source in ('youtube','drive','mega','direct','upload')),
  url text check (url is null or url ~ '^https://'),
  storage_path text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_videos_source_ok check (
    (source = 'upload' and storage_path is not null) or (source <> 'upload' and url is not null)
  )
);
create index if not exists course_videos_course_idx on public.course_videos (course_id, sort_order, created_at);
create index if not exists course_videos_folder_idx on public.course_videos (folder_id);

-- ================= Security (RLS) =================
alter table public.course_folders enable row level security;
alter table public.course_videos enable row level security;

drop policy if exists "admin all" on public.course_folders;
drop policy if exists "login read" on public.course_folders;
drop policy if exists "admin all" on public.course_videos;
drop policy if exists "login read" on public.course_videos;

create policy "admin all" on public.course_folders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin all" on public.course_videos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Student: sirf login ke baad, sirf published course ka published content
create policy "login read" on public.course_folders for select to authenticated
  using (is_published and exists (select 1 from public.courses c where c.id = course_id and c.is_published));
create policy "login read" on public.course_videos for select to authenticated
  using (is_published and exists (select 1 from public.courses c where c.id = course_id and c.is_published));

drop trigger if exists course_folders_updated_at on public.course_folders;
create trigger course_folders_updated_at before update on public.course_folders
  for each row execute function public.set_updated_at();
drop trigger if exists course_videos_updated_at on public.course_videos;
create trigger course_videos_updated_at before update on public.course_videos
  for each row execute function public.set_updated_at();

-- ================= Private Storage bucket (upload kiye hue videos) =================
-- Limit 50 MB (Supabase free plan ki hadd). Pro plan par badha sakte ho.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-videos', 'course-videos', false, 52428800, array['video/mp4','video/webm','video/quicktime','video/x-m4v'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course-videos read (login)" on storage.objects;
drop policy if exists "course-videos admin write" on storage.objects;
drop policy if exists "course-videos admin update" on storage.objects;
drop policy if exists "course-videos admin delete" on storage.objects;
create policy "course-videos read (login)" on storage.objects for select to authenticated
  using (bucket_id = 'course-videos');
create policy "course-videos admin write" on storage.objects for insert to authenticated
  with check (bucket_id = 'course-videos' and public.is_admin());
create policy "course-videos admin update" on storage.objects for update to authenticated
  using (bucket_id = 'course-videos' and public.is_admin());
create policy "course-videos admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'course-videos' and public.is_admin());

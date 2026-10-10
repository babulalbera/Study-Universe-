-- Study Universe: Phase 2 schema. Supabase Dashboard > SQL Editor mein chalao.

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Naya user bante hi profile apne aap ban jaye (role hamesha 'student')
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Koi user khud ko admin na bana sake (SQL Editor / service role se bana sakte ho)
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'role badalne ki ijazat nahi hai';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ===== site content =====
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.home_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.feature_cards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text not null default '',
  href text,
  color text not null default '#D4AF37',
  bg1 text not null default '#1E293B',
  bg2 text not null default '#0F172A',
  icon_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  action_label text not null default 'Join Now',
  subtitle text not null default '',
  href text,
  color text not null default '#ffffff',
  glow text not null default '#ffffff',
  border text not null default '',
  bg1 text not null default '#111111',
  bg2 text not null default '#000000',
  icon_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== tasks =====
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null default '',
  note text not null default '',
  due_date date,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.task_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

-- ===== books =====
create table public.book_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.books (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.book_categories(id) on delete set null,
  title text not null,
  author text not null default '',
  description text not null default '',
  storage_path text,                       -- bucket "books" ke andar ka path (private)
  pages int,
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== mock tests =====
create table public.test_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- jaise "SSC CGL"
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.test_categories(id) on delete set null,
  title text not null,
  description text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  total_marks numeric not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_index smallint not null check (correct_index >= 0),   -- SIRF server/admin dekh sakta hai
  marks numeric not null default 1,
  negative_marks numeric not null default 0,
  explanation text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','submitted')),
  score numeric,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);
create table public.attempt_answers (
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_index smallint,
  is_correct boolean,
  primary key (attempt_id, question_id)
);

-- ===== extras =====
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('book','test','task')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,   -- null = sabke liye
  title text not null,
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- updated_at apne aap badle
do $$
declare t text;
begin
  foreach t in array array['profiles','site_settings','home_sections','feature_cards','social_links',
    'announcements','tasks','books','mock_tests','questions'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

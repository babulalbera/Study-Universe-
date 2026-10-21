-- Phase 9: Profile redesign ka backend. Dobara chalane par bhi safe (idempotent).
-- Isme 008_courses.sql ka kaam bhi shamil hai (courses table live DB me abhi bana nahi tha).

-- ===== 1) courses (008 se) =====
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

-- ===== 2) profiles: bio (quote) + ui_prefs (language / theme) =====
alter table public.profiles
  add column if not exists bio text,
  add column if not exists ui_prefs jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_bio_chk;
alter table public.profiles add constraint profiles_bio_chk check (bio is null or char_length(bio) <= 120);
alter table public.profiles drop constraint if exists profiles_ui_prefs_chk;
alter table public.profiles add constraint profiles_ui_prefs_chk check (jsonb_typeof(ui_prefs) = 'object');

-- ===== 3) user_book_activity: Continue Learning ke liye progress =====
alter table public.user_book_activity
  add column if not exists last_page int not null default 0,
  add column if not exists progress_pct smallint not null default 0;

alter table public.user_book_activity drop constraint if exists uba_page_chk;
alter table public.user_book_activity add constraint uba_page_chk check (last_page >= 0);
alter table public.user_book_activity drop constraint if exists uba_pct_chk;
alter table public.user_book_activity add constraint uba_pct_chk check (progress_pct between 0 and 100);

-- Book ka progress save karne ka safe tareeka (sirf apna, RLS "own all" lagu rehta hai)
create or replace function public.save_book_progress(p_book uuid, p_page int, p_pct int)
returns void
language sql security invoker set search_path = public as $$
  insert into public.user_book_activity (user_id, book_id, last_opened_at, last_page, progress_pct)
  values (auth.uid(), p_book, now(), greatest(coalesce(p_page, 0), 0), least(greatest(coalesce(p_pct, 0), 0), 100))
  on conflict (user_id, book_id) do update
    set last_opened_at = now(),
        last_page = excluded.last_page,
        progress_pct = excluded.progress_pct;
$$;
revoke all on function public.save_book_progress(uuid, int, int) from public, anon;
grant execute on function public.save_book_progress(uuid, int, int) to authenticated;

-- ===== 4) daily_quotes: "Krishna Blessings" banner ka roz ka shlok =====
create table if not exists public.daily_quotes (
  id uuid primary key default gen_random_uuid(),
  shloka text not null check (char_length(shloka) between 5 and 300),
  meaning text not null default '' check (char_length(meaning) <= 300),
  source text not null check (char_length(source) between 2 and 60),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists daily_quotes_source_uq on public.daily_quotes (source);
alter table public.daily_quotes enable row level security;
drop policy if exists "public read" on public.daily_quotes;
drop policy if exists "admin all" on public.daily_quotes;
create policy "public read" on public.daily_quotes for select using (is_active);
create policy "admin all" on public.daily_quotes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop trigger if exists daily_quotes_updated_at on public.daily_quotes;
create trigger daily_quotes_updated_at before update on public.daily_quotes for each row execute function public.set_updated_at();

insert into public.daily_quotes (shloka, meaning, source, sort_order) values
  ('कर्मण्येवाधिकारस्ते मा फलेषु कदाचन', 'कर्म करना तुम्हारा अधिकार है, फल पर नहीं। मेहनत करो, फल की चिंता छोड़ो।', 'अध्याय 2, श्लोक 47', 1),
  ('योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय', 'आसक्ति छोड़कर, सफलता-असफलता में समान रहकर अपना कर्म करो।', 'अध्याय 2, श्लोक 48', 2),
  ('योगः कर्मसु कौशलम्', 'कर्म में कुशलता ही योग है। जो भी करो, पूरे मन से करो।', 'अध्याय 2, श्लोक 50', 3),
  ('तस्मादसक्तः सततं कार्यं कर्म समाचर', 'फल की आसक्ति छोड़कर अपना कर्तव्य लगातार करते रहो।', 'अध्याय 3, श्लोक 19', 4),
  ('श्रद्धावाँल्लभते ज्ञानं तत्परः संयतेन्द्रियः', 'श्रद्धावान और संयमी व्यक्ति ही ज्ञान पाता है।', 'अध्याय 4, श्लोक 39', 5),
  ('उद्धरेदात्मनाऽऽत्मानं नात्मानमवसादयेत्', 'अपने आप को खुद ऊपर उठाओ, खुद को गिराओ मत।', 'अध्याय 6, श्लोक 5', 6),
  ('अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते', 'लगातार अभ्यास और वैराग्य से चंचल मन वश में होता है।', 'अध्याय 6, श्लोक 35', 7)
on conflict (source) do nothing;

-- Aaj ka shlok (din ke hisaab se badalta hai, India time)
create or replace function public.todays_quote()
returns table (shloka text, meaning text, source text)
language sql stable set search_path = public as $$
  with q as (
    select d.shloka, d.meaning, d.source,
           row_number() over (order by d.sort_order, d.created_at, d.id) as rn,
           count(*) over () as n
    from public.daily_quotes d
    where d.is_active
  )
  select q.shloka, q.meaning, q.source
  from q
  where q.rn = (extract(doy from (now() at time zone 'Asia/Kolkata'))::int % q.n) + 1;
$$;
grant execute on function public.todays_quote() to anon, authenticated;

-- ===== 5) Points, Level, Rank (sirf apna data; dusron ka kuch nahi dikhta) =====
-- Points = 10 x (admin Tasks poore) + 20 x (submit kiye Mock Tests) + Mock Test ke kul number
-- Level  = har 100 points par +1 (0-99 = LVL 1)
create or replace function public.my_points_rank()
returns table (points int, level int, user_rank int, total_users int)
language sql stable security definer set search_path = public as $$
  with pts as (
    select p.id,
           (
             coalesce((select count(*) from public.task_completions c where c.user_id = p.id), 0) * 10
           + coalesce((select count(*) from public.test_attempts a where a.user_id = p.id and a.status = 'submitted'), 0) * 20
           + coalesce((select round(sum(greatest(a.score, 0))) from public.test_attempts a where a.user_id = p.id and a.status = 'submitted'), 0)
           )::int as points
    from public.profiles p
  ),
  me as (select points from pts where id = auth.uid())
  select me.points,
         (me.points / 100) + 1,
         (select count(*) from pts where pts.points > me.points)::int + 1,
         (select count(*) from pts)::int
  from me;
$$;
revoke all on function public.my_points_rank() from public, anon;
grant execute on function public.my_points_rank() to authenticated;

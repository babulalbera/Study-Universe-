-- Phase 20: Free Course platforms (admin panel se platform box, links aur logo)
create table if not exists public.free_platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '' check (char_length(description) <= 200),
  color text not null default '#D4AF37' check (color ~ '^#[0-9a-fA-F]{6}$'),
  logo_path text check (logo_path is null or logo_path ~* '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  logo_url text check (logo_url is null or logo_url ~ '^https?://'),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.free_platform_links (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.free_platforms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  url text not null check (url ~ '^https?://'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists free_platforms_list_idx on public.free_platforms (sort_order, created_at);
create index if not exists free_platform_links_idx on public.free_platform_links (platform_id, sort_order, created_at);

alter table public.free_platforms enable row level security;
alter table public.free_platform_links enable row level security;
drop policy if exists "public read" on public.free_platforms;
drop policy if exists "admin all" on public.free_platforms;
drop policy if exists "public read" on public.free_platform_links;
drop policy if exists "admin all" on public.free_platform_links;
create policy "public read" on public.free_platforms for select using (is_published);
create policy "admin all" on public.free_platforms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.free_platform_links for select
  using (exists (select 1 from public.free_platforms p where p.id = platform_id and p.is_published));
create policy "admin all" on public.free_platform_links for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists free_platforms_updated_at on public.free_platforms;
create trigger free_platforms_updated_at before update on public.free_platforms for each row execute function public.set_updated_at();
drop trigger if exists free_platform_links_updated_at on public.free_platform_links;
create trigger free_platform_links_updated_at before update on public.free_platform_links for each row execute function public.set_updated_at();

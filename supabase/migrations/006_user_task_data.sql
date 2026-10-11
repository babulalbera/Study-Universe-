-- Phase 6: Har user ka apna Task page ka data (tasks, done, todos, notes, streak history).
-- Privacy: sirf khud user dekh/badal sakta hai (Admin bhi nahi).
create table public.user_task_data (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_task_data enable row level security;
create policy "own all" on public.user_task_data for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger user_task_data_updated_at before update on public.user_task_data
  for each row execute function public.set_updated_at();

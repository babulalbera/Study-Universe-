-- Row Level Security: har table par chalu. Policy nahi = access nahi.

do $$
declare t text;
begin
  foreach t in array array['profiles','site_settings','home_sections','feature_cards','social_links',
    'announcements','tasks','task_completions','book_categories','books','test_categories','mock_tests',
    'questions','test_attempts','attempt_answers','bookmarks','notifications','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    -- Admin ko sab kuch (role ki jaanch database mein hoti hai, frontend par nahi)
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Sabko dikhne wala content (login ke bina bhi)
create policy "public read" on public.site_settings for select using (true);
create policy "public read" on public.home_sections for select using (is_visible);
create policy "public read" on public.feature_cards for select using (is_visible);
create policy "public read" on public.social_links for select using (is_visible);
create policy "public read" on public.announcements for select using (
  is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "public read" on public.tasks for select using (is_active);
create policy "public read" on public.book_categories for select using (true);
create policy "public read" on public.books for select using (is_published);
create policy "public read" on public.test_categories for select using (true);
create policy "public read" on public.mock_tests for select using (is_published);
-- DHYAN: questions par student policy NAHI hai -> sahi uttar (correct_index) kabhi leak nahi hoga.

-- Sirf apna data
create policy "own read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own all" on public.task_completions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own read" on public.test_attempts for select to authenticated using (user_id = auth.uid());
-- test_attempts / attempt_answers mein student INSERT nahi kar sakta (score fake na ho); Phase 4 ka server function likhega.
create policy "own read" on public.attempt_answers for select to authenticated
  using (exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy "own all" on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own or broadcast read" on public.notifications for select to authenticated using (user_id = auth.uid() or user_id is null);
create policy "own mark read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private PDF bucket
insert into storage.buckets (id, name, public) values ('books', 'books', false) on conflict (id) do nothing;
create policy "books read (login)" on storage.objects for select to authenticated using (bucket_id = 'books');
create policy "books admin write" on storage.objects for insert to authenticated with check (bucket_id = 'books' and public.is_admin());
create policy "books admin update" on storage.objects for update to authenticated using (bucket_id = 'books' and public.is_admin());
create policy "books admin delete" on storage.objects for delete to authenticated using (bucket_id = 'books' and public.is_admin());

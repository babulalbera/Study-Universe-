-- Telegram Bind + Referral + Full-Lock Gate system poori tarah hata rahe hain.
-- Supabase Dashboard > SQL Editor mein chalao.

drop trigger if exists profiles_protect_telegram on public.profiles;
drop function if exists public.protect_telegram_referral();
drop policy if exists "see own referrals" on public.profiles;

drop table if exists public.pending_referrals;

alter table public.profiles
  drop column if exists telegram_id,
  drop column if exists telegram_username,
  drop column if exists telegram_linked_at,
  drop column if exists link_code,
  drop column if exists link_code_expires_at,
  drop column if exists referral_code,
  drop column if exists referred_by,
  drop column if exists channel_member;

-- Naya-user wala trigger function wapas simple (shuru wala) version par
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

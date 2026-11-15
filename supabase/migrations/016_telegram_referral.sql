-- Study Universe: Phase 6-extra — Telegram Account Bind + Referral System
-- Supabase Dashboard > SQL Editor mein chalao (jaise pichhli migrations chalayi thi).

alter table public.profiles
  add column telegram_id bigint unique,
  add column telegram_username text,
  add column telegram_linked_at timestamptz,
  add column link_code text unique,
  add column link_code_expires_at timestamptz,
  add column referral_code text unique,
  add column referred_by uuid references public.profiles(id) on delete set null;

-- Purane (pehle se bane) users ko bhi ek referral_code do; naye users ko trigger se milega
update public.profiles set referral_code = substr(md5(gen_random_uuid()::text), 1, 8) where referral_code is null;

-- Naya user bante hi profile + uska referral_code dono ban jayein
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, referral_code)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), substr(md5(gen_random_uuid()::text), 1, 8));
  return new;
end $$;
-- (trigger on_auth_user_created pehle se migration 001 mein bana hua hai, wo isi function ko call karega)

-- DHYAN: telegram_id / telegram_username / referred_by / referral_code SIRF server (webhook ya admin client)
-- badal sakta hai. Khud user apne "profile update" se nahi — warna koi bhi fake Telegram ID ya fake
-- referrer apni profile mein laga lega.
create or replace function public.protect_telegram_referral() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.telegram_id is distinct from old.telegram_id
       or new.telegram_username is distinct from old.telegram_username
       or new.referred_by is distinct from old.referred_by
       or new.referral_code is distinct from old.referral_code then
      raise exception 'Ye fields sirf server set kar sakta hai';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_protect_telegram before update on public.profiles
  for each row execute function public.protect_telegram_referral();

-- Referrer ko apne referral se aaye logon ki list dikhe (sirf unhi rows ka select, jinka referred_by = mera id)
create policy "see own referrals" on public.profiles for select to authenticated using (referred_by = auth.uid());

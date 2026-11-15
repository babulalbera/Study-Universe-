-- Study Universe: Full-Site Lock Gate (Telegram Bind + Channel Join + Referral Quota)
-- Supabase Dashboard > SQL Editor mein chalao.

alter table public.profiles add column channel_member boolean not null default false;

-- Pehle wala "sirf server badal sakta hai" trigger — ab channel_member bhi isme shaamil
create or replace function public.protect_telegram_referral() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.telegram_id is distinct from old.telegram_id
       or new.telegram_username is distinct from old.telegram_username
       or new.referred_by is distinct from old.referred_by
       or new.referral_code is distinct from old.referral_code
       or new.channel_member is distinct from old.channel_member then
      raise exception 'Ye fields sirf server set kar sakta hai';
    end if;
  end if;
  return new;
end $$;

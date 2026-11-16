-- Referral ab Telegram Bot ke "/start r_<code>" link se shuru hota hai, website link se nahi.
-- Jab tak naya banda apna StudyUniverse account bind nahi karta, uska referrer yahan "pending" rehta hai.

create table public.pending_referrals (
  telegram_id bigint primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.pending_referrals enable row level security;
-- Koi RLS policy nahi di — sirf server (admin client, webhook) isko padh/likh sakta hai.

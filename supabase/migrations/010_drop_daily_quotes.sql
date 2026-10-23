-- Krishna banner hat gaya, isliye roz ke shlok wala table aur function ab bekaar hain.
-- Live database se ye pehle hi hat chuke hain; ye file sirf record ke liye hai.
-- Dobara chalane par bhi safe (if exists).
drop function if exists public.todays_quote();
drop table if exists public.daily_quotes;

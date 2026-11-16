# Step 3 — Referral link ab Telegram Bot ka hai (website ka nahi) + Send button

## Kya badla
- Pehle: Referral link tha `studyuniverse.vercel.app/r/<code>` (website link, sirf Copy).
- Ab: Referral link hai `https://t.me/<BotUsername>?start=r_<code>` (Telegram Bot deep-link) + **Send button** (Telegram ke apne Share sheet se seedha kisi ko bhej sakte ho) + Copy button dono.
- Jab naya banda is link se bot kholega: bot usse bolega "pehle StudyUniverse par Signup karo, phir Link Code bhejo" — aur uska referral tab tak yaad rakhega jab tak wo apna account bind nahi kar leta.

## Files

**NAYI:**
- `supabase/migrations/018_pending_referrals.sql`

**OVERWRITE (poori file badli hai):**
- `app/api/telegram/webhook/route.ts`
- `app/gate/GateClient.tsx`
- `features/profile/dashboard/TelegramReferralCard.tsx`

## Daalo

```bash
cd ~/Study-Universe-
unzip ~/storage/downloads/study-universe-telegram-referral-link.zip -d ~/su-bundle5
cp -r ~/su-bundle5/bundle5/. ~/Study-Universe-/
```

Migration chalao (Supabase SQL Editor me paste + Run):
```bash
cat supabase/migrations/018_pending_referrals.sql
```

Push karo:
```bash
git add .
git commit -m "feat: referral via Telegram bot deep-link + send button"
git push origin main
```

## Test

1. Deploy "Ready" hone do.
2. Gate/Profile page pe "Referral Link Send Karo" dabao → Telegram ka share-sheet khulna chahiye.
3. Wo link kisi NAYE Telegram account se kholo (ya khud dusre account se) → bot "Welcome! Signup karo..." bolega.
4. Us naye account se StudyUniverse pe Signup karo → "Link Code banao" → Telegram bot ko bhejo.
5. Bind hote hi, pehle wale (referrer) account ka "Active Referrals" badh jaana chahiye (Channel join karne ke baad).

Purani website wali `app/r/[code]/route.ts` file ab use nahi ho rahi — chaho to rakho (harm nahi karti) ya delete kar do, dono chalega.

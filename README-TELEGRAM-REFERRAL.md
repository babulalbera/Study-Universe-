# Telegram Bind + Referral — Setup (Study Universe)

## Isme kya-kya hai

**NAYI files (seedha copy karo, repo me waisi hi paste karo — folder structure same hai):**
- `supabase/migrations/016_telegram_referral.sql`
- `app/api/telegram/webhook/route.ts`
- `app/r/[code]/route.ts`
- `features/profile/dashboard/telegram-actions.ts`
- `features/profile/dashboard/referral-actions.ts`
- `features/profile/dashboard/referral-queries.ts`
- `features/profile/dashboard/TelegramReferralCard.tsx`

**PURANI files (ye already tumhari repo me hain — inko OVERWRITE/REPLACE karo, poori file badal gayi hai):**
- `types/database.ts`
- `features/profile/types.ts`
- `features/profile/dashboard/queries.ts`
- `app/profile/page.tsx`
- `.env.example`

> Tip: Pehle `git status` / `git diff` se dekh lena ki tumne beech mein inme khud kuch badla to nahi tha, warna wo change overwrite ho jayega.

---

## Step 1 — Telegram Bot banao (5 min)

1. Telegram kholo, `@BotFather` ko msg karo.
2. `/newbot` bhejo → ek naam do (jaise "Study Universe Bot") → ek username do (jaise `StudyUniverseTG_bot`, ye `bot` se end hona chahiye).
3. BotFather tumhe ek **Token** dega, jaise: `123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
4. Ye Token aur Username dono sambhal ke rakho — agle step mein chahiye.

## Step 2 — Files repo me daalo

Upar di gayi file list ke hisaab se copy-paste karo (same path, same naam).

## Step 3 — `.env.local` aur Vercel env variables

`.env.example` me 3 naye variable dikhenge. Apni `.env.local` file me (aur Vercel ke Project Settings > Environment Variables me bhi) ye bharo:

```
TELEGRAM_BOT_TOKEN=<BotFather wala token>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<bot ka username, bina @ ke>
TELEGRAM_WEBHOOK_SECRET=<koi bhi lamba random string, jaise: 7f3a9c2e1b8d4f6a0c5e9b2d7f1a3c8e>
```

`TELEGRAM_WEBHOOK_SECRET` khud bana sakte ho (terminal me): `openssl rand -hex 20`

## Step 4 — Database migration chalao

Supabase Dashboard > SQL Editor me jaao → `supabase/migrations/016_telegram_referral.sql` ka pura content paste karo → Run dabao.

(Agar Supabase CLI use karte ho: `supabase db push`)

## Step 5 — Deploy karo (Vercel)

Normal deploy — `git push` karo, Vercel apne aap build kar dega (env variables Step 3 me daal chuke ho).

## Step 6 — Telegram ko batao webhook kaha bhejna hai

Deploy hone ke baad, apne terminal/browser se ye URL ek baar kholo (values apni daalo):

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<tumhari-site>.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Response me `"ok":true` aana chahiye.

## Step 7 — Test karo

1. Apni site pe Login karke `/profile` page kholo.
2. Niche "📱 Telegram Account" card dikhega → **"Link Code banao"** dabao.
3. Jo button aayega ("Telegram Bot Kholo") usko tap karo → Telegram app khulegi, bot ki chat khulegi.
4. "Start" dabao (ya bhej do) → bot turant "✅ Telegram link ho gaya!" reply karega.
5. Wapas Profile page pe aakar **page refresh** karo → "Telegram linked: @tumhara_username" dikhega.
6. Niche "🎁 Referral" me apna link copy karo (`/r/<tumhara-code>`) — kisi aur browser/incognito me usse signup karke dekho, count badhna chahiye.

---

## Dhyan rakhne wali baatein

- **Manual refresh:** Telegram se "link ho gaya" ka reply turant aata hai, par website tab usko turant nahi dikhayega — refresh karna padega. (Chaaho to baad me 3-4 second ka auto-check/polling add kar sakte ho — abhi simple rakha hai.)
- **Security:** `telegram_id`, `referred_by`, `referral_code` — ye fields sirf server (webhook / admin client) set kar sakta hai, khud user apni profile update se nahi. Ye migration ke andar ek database trigger (`protect_telegram_referral`) se lock hai. Isko mat hatana.
- Referral me abhi sirf "kitne log join hue" ginti hoti hai. "Un logo ko channel bhi join karna zaroori hai" wala extra gate isme nahi hai — agar chahiye to bata dena, alag se bana denge.

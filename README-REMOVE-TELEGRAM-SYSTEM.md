# Telegram Bind + Referral + Lock Gate — Poori Tarah Hatao

## Step 1 — Ye files/folders DELETE karo (Termux)

```bash
cd ~/Study-Universe-
rm -rf app/gate
rm -rf app/api/telegram
rm -rf "app/r"
rm -rf features/gate
rm -f features/profile/dashboard/telegram-actions.ts
rm -f features/profile/dashboard/referral-actions.ts
rm -f features/profile/dashboard/referral-queries.ts
rm -f features/profile/dashboard/TelegramReferralCard.tsx
```

## Step 2 — Zip extract karke, ye files OVERWRITE karo

```bash
unzip ~/storage/downloads/study-universe-remove-telegram-system.zip -d ~/su-bundle6
cp -r ~/su-bundle6/bundle6/. ~/Study-Universe-/
```

Ye files purani (shuruati) halat me wapas aa jayengi:
- `lib/supabase/middleware.ts`
- `app/profile/page.tsx`
- `types/database.ts`
- `features/profile/types.ts`
- `features/profile/dashboard/queries.ts`
- `.env.example`

## Step 3 — Database se sab hatao

Supabase SQL Editor me paste karo, Run dabao:
```bash
cat supabase/migrations/019_remove_telegram_referral_gate.sql
```

## Step 4 — Push karo

```bash
git add .
git commit -m "revert: telegram bind + referral + lock gate poori tarah hataya"
git push origin main
```

## Step 5 — Telegram ko bhi bata do (taaki wo bekaar me call na kare)

```bash
source .env.local
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```

## Step 6 (optional) — Vercel ke Environment Variables se ye 8 hata do

Settings → Environment Variables se ye sab remove kar sakte ho (ab kisi kaam ke nahi):
`TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_CHANNEL_ID`, `NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK`, `NEXT_PUBLIC_SITE_URL`, `REFERRAL_QUOTA`

---

Deploy "Ready" hone ke baad site bilkul waisi ho jaani chahiye jaisi Telegram feature shuru hone se pehle thi — koi `/gate` redirect nahi, `/profile` page bhi wapas purana.

# Full-Site Lock Gate — Setup (Part 2)

Pehle wala Telegram Bind + Referral already bana hua hai. Ab iske upar ye add ho raha hai:
- Site tab tak **pura lock** rahegi jab tak: Telegram linked + tumhare Channel ka member + {REFERRAL_QUOTA} active referrals na ho.
- Koi referred banda agar Channel **chhod de**, to lock wapas aa jayega (real-time).

## Files

**NAYI:**
- `supabase/migrations/017_full_lock_gate.sql`
- `features/gate/queries.ts`
- `app/gate/page.tsx`
- `app/gate/GateClient.tsx`
- `app/api/telegram/status/route.ts`

**OVERWRITE karni hain (poori file badli hai):**
- `lib/supabase/middleware.ts`
- `app/api/telegram/webhook/route.ts`
- `types/database.ts`
- `.env.example`

---

## Step 1 — Apne Channel ki numeric ID nikalo

1. Apne Telegram Bot ko Channel/Group me **Admin** banao (zaroori hai, warna membership check fail hoga).
2. Channel me koi bhi ek message ko **`@username_to_id_bot`** (ya `@getidsbot`) ko **forward** karo.
3. Wo bot tumhe ek number dega, jaisa: `-1001234567890`. Yahi tumhara `TELEGRAM_CHANNEL_ID` hai.

## Step 2 — Files copy + `.env.local` update

Upar ki list ke hisab se files daalo. Fir `.env.local` me 4 naye values bharo:
```
TELEGRAM_CHANNEL_ID=-1001234567890
NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK=https://t.me/apna_channel_username
NEXT_PUBLIC_SITE_URL=https://studyuniverse.vercel.app
REFERRAL_QUOTA=1
```
(Yahi 4 Vercel ke Environment Variables me bhi daalo.)

## Step 3 — Migration chalao

Supabase SQL Editor me `017_full_lock_gate.sql` ka content paste karke Run karo.

## Step 4 — Deploy karo

```bash
git add .
git commit -m "feat: full-site lock gate (telegram + channel + referral)"
git push origin main
```

## Step 5 — Webhook dobara set karo (IMPORTANT: ab `chat_member` bhi chahiye)

Pehle wali `setWebhook` command sirf messages ke liye thi. Ab Telegram ko **channel join/leave events bhi** bhejne hain:

```bash
curl -G "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  --data-urlencode "url=https://studyuniverse.vercel.app/api/telegram/webhook" \
  --data-urlencode "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  --data-urlencode 'allowed_updates=["message","chat_member"]'
```
Response me `"ok":true` aana chahiye.

## Step 6 — Test karo

1. Apni site pe login karo → **seedha `/gate` pe redirect** ho jaoge (kyunki abhi kuch complete nahi).
2. "Link Code banao" → Telegram bot kholo → Start dabao.
3. Bot reply karega "Channel join karo" + ek button → Channel join karo.
4. Wapas site pe "Check Status" dabao (ya bot ko dobara `/start` bhejo) → ab "Active Referrals: 0/1" dikhega.
5. Doosre account se apna Referral Link use karke signup karo, usko bhi Channel join karwao.
6. Pehle wale account me "Check Status" dabao → site **unlock** ho jaani chahiye, home page khulega.
7. **Re-lock test:** doosre account se Channel **leave** karo → kuch second me pehla account wapas `/gate` pe chala jayega (agli baar koi bhi page kholne par).

---

## Dhyan rakhne wali baatein

- **Admin bypass:** Jin users ka `role = admin` hai, unke liye gate kabhi nahi lagega.
- **Bot Admin hona zaroori hai** channel me — warna `getChatMember` fail hoga aur sab "not member" dikhega.
- `REFERRAL_QUOTA=0` rakhoge to sirf Telegram+Channel chahiye hoga, referral ki zaroorat nahi.
- Agar galti se khud ko lock kar liya (apna hi account admin nahi hai), Supabase Table Editor me apni profile row kholke `role` ko `admin` kar do — turant unlock ho jaoge.

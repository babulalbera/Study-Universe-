# Study Universe

Next.js (App Router) + TypeScript + Tailwind + Supabase + Vercel

## अपने कंप्यूटर पर चलाना (सरल हिंदी)

1. Node.js (LTS) इंस्टॉल करें: https://nodejs.org
2. इस Folder में Terminal खोलकर:
   ```
   npm install
   npm run dev
   ```
3. Browser में खोलें: http://localhost:3000
4. जाँच के लिए: `npm run typecheck` और `npm run lint`

## .env.local (Phase 2 में चाहिए)

`.env.example` की कॉपी बनाकर नाम `.env.local` रखें और खाली जगह भरें।
Supabase Keys: Supabase Dashboard → Project Settings → API।
⚠️ `SUPABASE_SERVICE_ROLE_KEY` गुप्त है – किसी को न दिखाएँ, GitHub पर न डालें।

## चरण (Phases)

- Phase 1 ✅ Home + सभी Pages का UI
- Phase 2 ✅ Supabase Database + Authentication (SQL files: supabase/migrations)
- Phase 3 ⏳ Admin Panel + Permissions
- Phase 4 ⏳ Tasks, Books, Mock Tests, Results
- Phase 5 ⏳ Testing, Security, Performance
- Phase 6 ⏳ Vercel Deployment

## Home के Links बदलना

अभी `features/home/data.ts` में (Phase 3 के बाद Admin Panel से)।

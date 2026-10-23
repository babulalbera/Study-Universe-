#!/bin/sh
# 1) Vite ke zamane ki tailwind.config.ts hatata hai (Tailwind v4 me use nahi hoti)
# 2) 010_drop_daily_quotes.sql ka record jodta hai
set -e
cd ~/Study-Universe-

git rm -f --ignore-unmatch tailwind.config.ts
git add supabase/migrations/010_drop_daily_quotes.sql

echo "== commit hone wali badlav =="
git status --short

git commit -m "chore: tailwind.config.ts hataya, daily_quotes drop ka record"
git push -u origin chore/cleanup-config
echo "== ho gaya. Ab GitHub par PR kholo =="

#!/bin/sh
# Study Universe: Step 5 saaf karke push karta hai.
# 1) purani Step 5 ki 6 extra files hatata hai  2) sirf 8 sahi files add karta hai  3) commit + push
set -e
cd ~/Study-Universe-

git checkout feat/profile-redesign
git pull --rebase --autostash origin feat/profile-redesign

echo "== purani files hata raha hoon =="
git rm -f --ignore-unmatch \
  features/profile/dashboard/SettingsList.tsx \
  features/profile/dashboard/BioForm.tsx \
  features/profile/dashboard/bio-actions.ts \
  features/profile/dashboard/prefs-actions.ts \
  features/profile/dashboard/profile-i18n.ts \
  features/profile/dashboard/settings-queries.ts

echo "== sirf ye 8 sahi files add ho rahi hain =="
git add \
  app/profile/page.tsx \
  app/profile/settings/page.tsx \
  lib/i18n.ts \
  features/profile/dashboard/BioEditor.tsx \
  features/profile/dashboard/SettingsMore.tsx \
  features/profile/dashboard/settings-actions.ts \
  features/profile/dashboard/redesign-queries.ts \
  features/profile/dashboard/profile-redesign.css

echo "== commit hone wali badlav =="
git status --short

if git diff --cached --quiet; then
  echo "Kuch badalna nahi tha. Seedha push kar raha hoon."
else
  git commit -m "fix: Step 5 saaf (purani 6 files hatayi, sahi 8 files)"
fi

git push
echo "== ho gaya. Ab GitHub PR me Vercel ka hara tick dekho =="

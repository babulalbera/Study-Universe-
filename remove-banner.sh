#!/bin/sh
# Krishna banner ka bacha hua code hatata hai aur naye branch me push karta hai.
set -e
cd ~/Study-Universe-

git rm -f --ignore-unmatch features/profile/dashboard/KrishnaBanner.tsx
git add features/profile/dashboard/redesign-queries.ts features/profile/dashboard/profile-redesign.css

echo "== commit hone wali badlav =="
git status --short

git commit -m "chore: Krishna banner ka bacha hua code hataya"
git push -u origin chore/remove-banner
echo "== ho gaya. Ab GitHub par PR kholo =="

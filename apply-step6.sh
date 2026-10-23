#!/bin/sh
# Step 6: poore Profile page par Hindi/English. Sirf ye 10 files add hoti hain, aur kuch nahi.
set -e
cd ~/Study-Universe-

git add \
  lib/i18n.ts \
  app/profile/page.tsx \
  features/profile/dashboard/ProfileHeader.tsx \
  features/profile/dashboard/QuickAccess.tsx \
  features/profile/dashboard/StudyOverview.tsx \
  features/profile/dashboard/ContinueLearning.tsx \
  features/profile/dashboard/continue-queries.ts \
  features/profile/dashboard/LearningCards.tsx \
  features/profile/dashboard/CommunityRow.tsx \
  features/profile/dashboard/profile-redesign.css

echo "== commit hone wali badlav =="
git status --short

git commit -m "feat: profile Step 6 (poore page par Hindi/English)"
git push -u origin feat/profile-i18n
echo "== ho gaya. Ab GitHub par PR kholo =="

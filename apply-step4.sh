#!/bin/bash
# Repo ke root me chalao (zip unzip karne ke BAAD): bash apply-step4.sh
# Purana iframe wala Tasks page hatata hai. Pehle check karta hai ki koi aur file unhe use to nahi kar rahi.
set -e
OLD="components/tasks/TaskFrame.tsx app/tasks/app/route.ts lib/task-page.ts lib/task-template.ts lib/themeify.ts lib/theme-assets.ts"

# 1) Safety: in purani files ko ab koi import to nahi kar raha? (khud purani files ko chhod kar dekho)
EXCL=""; for f in $OLD; do EXCL="$EXCL --exclude=$(basename $f)"; done
HITS=$(grep -rnE "task-page|task-template|themeify|theme-assets|TaskFrame|/tasks/app" app components lib features --include=*.ts --include=*.tsx $EXCL 2>/dev/null | grep -v "^lib/study-stats.ts" || true)
if [ -n "$HITS" ]; then
  echo "RUKO: ye files abhi bhi purani cheezon ko use kar rahi hain, kuch delete nahi kiya:"
  echo "$HITS"
  exit 1
fi

# 2) Purani files hatao
for f in $OLD; do if [ -e "$f" ]; then rm -f "$f"; echo "hata diya: $f"; fi; done
rmdir app/tasks/app 2>/dev/null || true

# 3) Ek comment ka naam theek karo
if [ -f lib/study-stats.ts ]; then sed -i 's#lib/task-page.ts#features/tasks/model.ts#' lib/study-stats.ts; fi
echo "Done. Ab: npm run build (check) phir git add/commit/push."

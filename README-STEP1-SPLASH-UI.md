# Step 1 of 1 — Gate Page Splash Screens (StudyKing jaisa look)

Is round me sirf **EK** file hai — na migration, na naya env var, na backend change.
Backend (Telegram bind + Channel check) pehle se hi kaam kar raha hai (DB se confirm kiya tha).

**OVERWRITE karni hai (poori file badli hai):**
- `app/gate/GateClient.tsx`

## Kya naya hai
- "Link Code banao" dabate hi **"Creating Link Session..."** (🎓 icon + spinner) full-screen dikhega.
- "Check Status" dabate hi **"Validating Membership..."** (🛡️ icon + spinner) dikhega.
- Code mil jaane ke baad **"Waiting for Telegram..."** wala message bhi StudyKing jaisa hi.

## Daalo
```bash
cd ~/Study-Universe-
unzip ~/storage/downloads/study-universe-gate-splash-ui.zip -d ~/su-bundle3
cp -r ~/su-bundle3/bundle3/. ~/Study-Universe-/
git add .
git commit -m "style: gate page splash screens (StudyKing look)"
git push origin main
```

Deploy "Ready" hone ke baad, `/gate` page khol ke dekho — buttons dabake har state check karo.

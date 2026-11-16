# Step 2 — Cancel & Reset

**OVERWRITE karni hain (poori file badli hai):**
- `app/gate/GateClient.tsx`
- `features/profile/dashboard/telegram-actions.ts`

Koi migration/env nahi chahiye.

```bash
cd ~/Study-Universe-
unzip ~/storage/downloads/study-universe-gate-cancel-reset.zip -d ~/su-bundle4
cp -r ~/su-bundle4/bundle4/. ~/Study-Universe-/
git add .
git commit -m "feat: gate page Cancel & Reset button"
git push origin main
```

Deploy "Ready" hone ke baad: `/gate` → "Link Code banao" → ab code ke saath "Cancel & Reset" bhi dikhega. Dabane se code turant cancel ho jayega aur "Link Code banao" button wapas aa jayega.

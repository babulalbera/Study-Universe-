#!/usr/bin/env bash
# Kisi platform ka asli logo lagane ke liye:
#   bash set-logo.sh <platform-id> <image-url>
# Example:  bash set-logo.sh sway https://example.com/sway-logo.png
# (Google Images me logo par long-press karke "Copy image address" se link milta hai.)
# Platform ids: features/platforms/data.ts me "id" dekho (pw, sway, vidyakul, selection-way ...)
set -e
id="$1"; url="$2"
if [ -z "$id" ] || [ -z "$url" ]; then echo "Use: bash set-logo.sh <platform-id> <image-url>"; exit 1; fi
cd "$(dirname "$0")"
mkdir -p public/platform-logos
curl -fL --max-time 40 -o "public/platform-logos/$id.png" "$url"
ID="$id" node -e '
const fs = require("fs"), f = "features/platforms/data.ts";
let s = fs.readFileSync(f, "utf8");
const id = process.env.ID;
const re = new RegExp("(\\{\"id\":\"" + id + "\".*?\"color\":\"#[0-9A-Fa-f]{6}\")(,\"logo\":\"[^\"]*\")?");
if (!re.test(s)) { console.error("Platform id nahi mila: " + id); process.exit(1); }
s = s.replace(re, "$1,\"logo\":\"/platform-logos/" + id + ".png\"");
fs.writeFileSync(f, s);
console.log("Logo set ho gaya: " + id);
'
echo "Ab:  git add . && git commit -m 'logo: $id' && git push"

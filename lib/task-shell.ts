// Task page (/tasks) ek alag standalone HTML hai. Ye uske bahar ka "shell" baaki website jaisa banata hai:
//  1) Theme button floating nahi, header me profile icon ke paas
//  2) Upar wala Krishna box (glow border) aur neeche wala Krishna box
// Andar ka task app (lib/task-template.ts) ko ye bilkul nahi chhuta. Koi marker na mile to us hisse ko chhod deta hai.

const SHELL_CSS = `
@property --kg-angle{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes kg-spin{to{--kg-angle:360deg}}

/* ---- Header: theme button + profile ---- */
.sx-act{display:flex;align-items:center;gap:10px;flex:none}
.sx-act .td{position:relative;right:auto;bottom:auto;left:auto;z-index:90;display:block}
.sx-act .td-fab{width:38px;height:38px;box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 14px color-mix(in srgb,var(--gold) 22%,transparent)}
.sx-act .td-fab svg{width:19px;height:19px}
.sx-act .td-pop{position:absolute;top:calc(100% + 12px);right:0;transform-origin:top right;max-width:calc(100vw - 24px)}
.sx-act .td:not(.open) .td-pop{transform:translateY(-8px) scale(.96)}

/* ---- Krishna boxes ---- */
.kx-wrap{position:relative;z-index:2;max-width:1200px;margin:12px auto 0;padding:0 max(16px,env(safe-area-inset-left)) 0 max(16px,env(safe-area-inset-right));font-family:Outfit,"Noto Sans Devanagari",system-ui,sans-serif}
.kx-wrap.kx-bot{margin-top:20px}
.kx{--kg-a:var(--em);--kg-b:var(--gold);--kg-c:var(--gold4);--kg-w:color-mix(in srgb,var(--gold3) 45%,#fff);
position:relative;padding:16px;border-radius:18px;color:#fff;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04)}
.kx:before{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;padding:2px;
background:conic-gradient(from var(--kg-angle),transparent 0deg,var(--kg-a) 16deg,var(--kg-b) 30deg,var(--kg-w) 42deg,var(--kg-b) 54deg,var(--kg-a) 68deg,transparent 86deg,transparent 180deg,var(--kg-a) 196deg,var(--kg-c) 210deg,var(--kg-w) 222deg,var(--kg-c) 234deg,var(--kg-a) 248deg,transparent 266deg,transparent 360deg);
-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
@media(prefers-reduced-motion:no-preference){.kx:before{animation:kg-spin 5s linear infinite}}
.kx-row{display:flex;gap:16px;align-items:center}
.kx-av{width:76px;height:76px;flex:none;border-radius:50%;overflow:hidden;border:3px solid var(--gold);background:#000;box-shadow:0 0 22px color-mix(in srgb,var(--gold) 45%,transparent),0 0 34px color-mix(in srgb,var(--em) 20%,transparent)}
.kx-av img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 22%}
.kx-k1{font:700 11.5px/1.3 Outfit,system-ui,sans-serif;letter-spacing:.12em;color:var(--gold)}
.kx-k2{font:700 15px/1.4 "Noto Sans Devanagari",Outfit,sans-serif;color:var(--gold3);margin-top:6px}
.kx-k3{font-size:13px;color:#a1a1aa;margin-top:4px}
.kx-q{margin-top:14px;padding:12px;border-radius:12px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.07);text-align:center}
.kx-q b{display:block;font:700 15px/1.5 "Noto Sans Devanagari",Outfit,sans-serif;color:var(--gold3)}
.kx-q span{display:block;font:500 13px/1.5 "Noto Sans Devanagari",Outfit,sans-serif;color:color-mix(in srgb,var(--mint) 85%,transparent);margin-top:2px}
.kx-q small{display:block;font:400 12px/1.5 "Noto Sans Devanagari",Outfit,sans-serif;color:#a1a1aa;margin-top:2px}
.kx.kx-st{display:flex;gap:14px;align-items:flex-start;padding:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--surf) 85%,transparent),color-mix(in srgb,var(--bg) 92%,transparent))}
.kx-st .kx-av{width:54px;height:54px;border-width:2px}
.kx-s1{font-size:13px;font-weight:700;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.kx-s1 span:nth-child(2n){color:#52525b}
.kx-s2{font-size:12px;color:#a1a1aa;margin-top:6px;line-height:1.45}
@media(min-width:768px){
 .kx{padding:22px}.kx.kx-st{padding:14px}
 .kx-row{gap:22px}.kx-av{width:92px;height:92px}.kx-st .kx-av{width:54px;height:54px}
 .kx-k2{font-size:17px}.kx-q b{font-size:17px}
}
`;

const HERO_HTML = `<div class="kx-wrap"><section class="kx" aria-label="Krishna Blessings">
<div class="kx-row"><div class="kx-av"><img src="/images/hero-krishna.webp" alt="Baby Krishna with peacock feather and flute" width="92" height="92"></div>
<div><div class="kx-k1">✦ KRISHNA BLESSINGS • PREMIUM EDIT</div><div class="kx-k2">कान्हा तुम्हारे साथ है • Straight 0°</div><div class="kx-k3">Har task complete = ashirwad +1</div></div></div>
<div class="kx-q"><b>“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन”</b><span>मेहनत तुम्हारी, सफलता निश्चित है</span><small>हौसला मत हारो, कान्हा तुम्हारे साथ है!</small></div>
</section></div>`;

const STRIP_HTML = `<div class="kx-wrap kx-bot"><section class="kx kx-st" aria-label="Jai Shri Krishna">
<div class="kx-av"><img src="/images/status-krishna.webp" alt="" width="54" height="54"></div>
<div style="min-width:0"><div class="kx-s1"><span>Best banao, roz jeeto</span><span>•</span><span style="color:var(--mint)">Premium Edit</span><span>•</span><span style="color:var(--gold2)">Jai Shri Krishna</span></div>
<div class="kx-s2">Premium dark • Gold+Emerald aura • Focus mode • Reset Din</div></div>
</section></div>`;

const ME_TAG = '<a class="sx-me" href="/profile" aria-label="Profile">👤</a>';

export function applyTaskShell(html: string): string {
  let out = html;

  // 1) Theme button (#su-td) ko floating jagah se hata kar header me profile icon ke saath rakho
  const dock = out.indexOf('<div class="td" id="su-td"');
  const head = out.indexOf('<header class="sx-hd">');
  if (dock >= 0 && head > dock && out.includes(ME_TAG)) {
    const dockHtml = out.slice(dock, head);
    out = out.slice(0, dock) + out.slice(head);
    out = out.replace(ME_TAG, () => `<div class="sx-act">${dockHtml}${ME_TAG}</div>`);
  }

  // 2) CSS + upar wala Krishna box: header (aur guest notice) ke baad, bottom bar ke CSS se pehle
  out = out.replace('<style id="nb-css">', () => `<style id="kx-css">${SHELL_CSS}</style>${HERO_HTML}<style id="nb-css">`);

  // 3) Neeche wala Krishna box: page ke sabse neeche (body ke band hone se pehle)
  const end = out.lastIndexOf("</body>");
  out = end < 0 ? out + STRIP_HTML : out.slice(0, end) + STRIP_HTML + out.slice(end);
  return out;
}

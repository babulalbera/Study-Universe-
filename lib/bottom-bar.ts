// Premium Bottom Bar (bottom_bar.html se). Ek hi CSS: Next pages (BottomBar.tsx) aur Task page (vanilla) dono mein.

const SANS = "Outfit,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

export const BOTTOM_BAR_CSS = `
.nb{--gold:#D4AF37;--gold2:#FFD700;--mute:#a1a1aa}
.nb{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom));z-index:55;
width:min(calc(100% - 24px),460px);height:66px;display:grid;grid-template-columns:repeat(5,1fr);align-items:stretch;padding:0 6px;border-radius:26px;
border:1px solid transparent;
background:linear-gradient(180deg,rgba(20,28,22,.9),rgba(4,8,5,.95)) padding-box,
linear-gradient(135deg,rgba(255,215,0,.85),rgba(212,175,55,.14) 38%,rgba(16,185,129,.16) 68%,rgba(16,185,129,.75)) border-box;
-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);
box-shadow:0 18px 40px rgba(0,0,0,.7),0 0 26px rgba(212,175,55,.08),inset 0 1px 0 rgba(255,255,255,.07)}
.nb:after{content:"";position:absolute;left:18%;right:18%;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,225,120,.9),transparent);pointer-events:none}
.nb button{appearance:none;-webkit-appearance:none;background:none;border:0;margin:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.nb a{text-decoration:none;-webkit-tap-highlight-color:transparent}
.nbp{position:absolute;left:0;top:8px;height:calc(100% - 16px);width:0;border-radius:18px;opacity:0;pointer-events:none;
background:linear-gradient(180deg,rgba(255,215,0,.24),rgba(212,175,55,.07));
box-shadow:inset 0 0 0 1px rgba(255,215,0,.38),0 0 22px rgba(255,215,0,.2),inset 0 1px 0 rgba(255,255,255,.12);
transition:transform .45s cubic-bezier(.2,.9,.3,1.15),width .3s,opacity .3s}
.nbp:after{content:"";position:absolute;left:50%;bottom:-5px;width:16px;height:3px;margin-left:-8px;border-radius:3px;background:var(--gold2);box-shadow:0 0 10px 1px rgba(255,215,0,.9)}
.nbi{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--mute);font:600 11px/1 var(--sans);letter-spacing:.02em;transition:color .25s}
.nbi .pl{display:grid;place-items:center;transition:transform .3s}
.nbi svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.nbi.on{color:var(--gold2)}
.nbi.on .pl{transform:translateY(-1px) scale(1.12)}
.nbi.on svg{filter:drop-shadow(0 0 6px rgba(255,215,0,.7))}
.nbi:active .pl{transform:scale(.88)}
.nbi.on:active .pl{transform:scale(1)}
.nb button:focus-visible,.nb a:focus-visible{outline:2px solid var(--gold2);outline-offset:-3px;border-radius:18px}
/* Tablet aur PC: poori chaudai mein (screen ke dono kinare se 24px chhod kar) */
@media(min-width:700px){
.nb{width:calc(100% - 48px);height:74px;bottom:calc(16px + env(safe-area-inset-bottom));border-radius:30px;padding:0 12px}
.nbp{top:9px;height:calc(100% - 18px);border-radius:22px}
.nbi{font-size:13px;gap:5px}
.nbi svg{width:26px;height:26px}
}
@media(prefers-reduced-motion:reduce){.nb *{transition:none!important}}
`;

// Sirf Task page (Next ke bahar ka alag HTML) ke liye: font + apna chhota toast
const STANDALONE_CSS = `
.nb{--sans:${SANS}}
#nbToast{position:fixed;left:50%;bottom:calc(104px + env(safe-area-inset-bottom));transform:translate(-50%,30px);opacity:0;z-index:80;max-width:90vw;padding:10px 16px;border-radius:12px;background:#111c13;border:1px solid #D4AF37;color:#FFEAA7;font:13px ${SANS};transition:.3s;pointer-events:none;text-align:center}
#nbToast.on{opacity:1;transform:translate(-50%,0)}
body{padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}
@media(min-width:700px){body{padding-bottom:calc(118px + env(safe-area-inset-bottom))!important}}
`;

export type BarConfig = { active: string; courseHref: string | null };

export const BAR_ICONS: Record<string, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  task: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  books: '<path d="M5 4h14v13H6.5A1.5 1.5 0 0 0 5 18.5z"/><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3M9 8h6"/>',
  course: '<circle cx="12" cy="12" r="9"/><path d="m10.5 8.8 4.5 3.2-4.5 3.2z"/>',
  prof: '<circle cx="12" cy="8.5" r="3.7"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
};
const ITEMS: [string, string][] = [["home", "Home"], ["task", "Tasks"], ["books", "Books"], ["course", "Courses"], ["prof", "Profile"]];

// Task page mein bar (HTML + CSS + chhota script)
export function bottomBarForTaskPage(cfg: BarConfig): string {
  const json = JSON.stringify(cfg).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const items = ITEMS.map(([k, n]) =>
    `<button type="button" class="nbi" data-k="${k}"><span class="pl"><svg viewBox="0 0 24 24" aria-hidden="true">${BAR_ICONS[k]}</svg></span>${n}</button>`).join("");
  return `<style id="nb-css">${BOTTOM_BAR_CSS}${STANDALONE_CSS}</style>
<nav class="nb" id="nb" aria-label="Main navigation"><span class="nbp" aria-hidden="true"></span>${items}</nav>
<div id="nbToast" role="status" aria-live="polite"></div>
<script>(function(){
var C=${json},bar=document.getElementById("nb"),pill=bar.querySelector(".nbp"),to=document.getElementById("nbToast"),
btns=[].slice.call(bar.querySelectorAll(".nbi")),tt,LINKS={home:"/",task:"/tasks",books:"/books",course:C.courseHref,prof:"/profile"};
function vib(){try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}}
function say(m){to.textContent=m;to.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){to.classList.remove("on")},2300)}
function place(){var cur=null;
 btns.forEach(function(b){var on=b.getAttribute("data-k")===C.active;b.classList.toggle("on",on);if(on){cur=b;b.setAttribute("aria-current","page")}});
 if(cur){pill.style.width=cur.offsetWidth+"px";pill.style.transform="translateX("+cur.offsetLeft+"px)";pill.style.opacity=1}else pill.style.opacity=0}
function go(u,name){if(!u){say(name+" ka link abhi set nahi hai");return}
 if(/^https?:/.test(u))window.open(u,"_blank","noopener,noreferrer");else location.href=u}
bar.addEventListener("click",function(e){var b=e.target.closest(".nbi");if(!b)return;vib();
 var k=b.getAttribute("data-k");if(k===C.active)return;go(LINKS[k],b.textContent.trim())});
addEventListener("resize",place);addEventListener("load",place);place();
})();</script>`;
}

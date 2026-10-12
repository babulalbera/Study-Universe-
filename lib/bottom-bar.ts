// Premium Bottom Bar (bottom_bar.html se). Ek hi CSS: Next pages (BottomBar.tsx) aur Task page (vanilla) dono mein.

const SANS = "Outfit,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

export const BOTTOM_BAR_CSS = `
.nb,.nsh{--gold:#D4AF37;--gold2:#FFD700;--mute:#a1a1aa}
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
.nb button:focus-visible,.nb a:focus-visible,.nsh button:focus-visible{outline:2px solid var(--gold2);outline-offset:-3px;border-radius:18px}
.nsh{position:fixed;inset:0;z-index:50}
.nsh[hidden]{display:none}
.nsh-bd{position:absolute;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;transition:opacity .3s}
.nsh-pn{position:absolute;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));width:min(calc(100% - 24px),460px);max-height:calc(100dvh - 120px);overflow-y:auto;transform:translate(-50%,28px) scale(.97);opacity:0;
padding:18px 18px 20px;border-radius:26px;border:1px solid transparent;
background:linear-gradient(180deg,rgba(22,32,25,.96),rgba(5,10,7,.98)) padding-box,linear-gradient(135deg,rgba(255,215,0,.8),rgba(212,175,55,.12) 40%,rgba(16,185,129,.2) 70%,rgba(16,185,129,.7)) border-box;
box-shadow:0 24px 60px rgba(0,0,0,.75);transition:transform .35s cubic-bezier(.2,.9,.3,1.1),opacity .3s}
.nsh.open .nsh-bd{opacity:1}
.nsh.open .nsh-pn{transform:translate(-50%,0) scale(1);opacity:1}
.nsh-x{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--mute);font-size:13px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.nsh-top{display:flex;align-items:center;gap:14px;padding-right:36px}
.nsh-av{width:60px;height:60px;flex:none;border-radius:50%;display:grid;place-items:center;font:800 26px var(--sans);color:#241a00;background:radial-gradient(circle at 30% 25%,#FFF1B0,#FFD700 50%,#C99A1C);box-shadow:0 0 20px rgba(212,175,55,.5)}
.nsh-t{font:800 19px/1.2 var(--sans);color:var(--gold2)}
.nsh-s{margin-top:4px;font:500 12.5px/1.3 var(--sans);color:#a7f3d0}
.nsh-pl{margin-top:18px;display:flex;justify-content:space-between;font:600 12.5px var(--sans);color:var(--mute)}
.nsh-pl b{color:#fff}
.nsh-tr{margin-top:8px;height:8px;border-radius:8px;background:rgba(255,255,255,.08);overflow:hidden}
.nsh-tr i{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#FFD700,#10B981);box-shadow:0 0 12px rgba(255,215,0,.5);transition:width .7s .15s}
.nsh-st{margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.nsh-st div{padding:12px 6px;border-radius:16px;text-align:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
.nsh-st b{display:block;font:800 20px/1 var(--sans);color:var(--gold2)}
.nsh-st span{display:block;margin-top:6px;font:500 11px var(--sans);color:var(--mute)}
.nsh-h{margin:18px 0 10px;font:700 12px var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.nsh-so{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.nsh-so button{padding:12px 4px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#fff;font:600 11.5px var(--sans);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s,border-color .2s}
.nsh-so button:active{transform:scale(.94);border-color:rgba(255,215,0,.5)}
.nsh-ac{margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
.nsh-ac a{padding:12px 4px;border-radius:16px;border:1px solid rgba(255,215,0,.35);background:rgba(255,215,0,.08);color:var(--gold2);font:700 12.5px var(--sans);text-align:center;text-decoration:none}
@media(prefers-reduced-motion:reduce){.nb *,.nsh *{transition:none!important}}
`;

// Sirf Task page (Next ke bahar ka alag HTML) ke liye: fonts/vars + apna chhota toast
const STANDALONE_CSS = `
.nb,.nsh{--sans:${SANS}}
#nbToast{position:fixed;left:50%;bottom:calc(98px + env(safe-area-inset-bottom));transform:translate(-50%,30px);opacity:0;z-index:80;max-width:90vw;padding:10px 16px;border-radius:12px;background:#111c13;border:1px solid #D4AF37;color:#FFEAA7;font:13px ${SANS};transition:.3s;pointer-events:none;text-align:center}
#nbToast.on{opacity:1;transform:translate(-50%,0)}
body{padding-bottom:calc(100px + env(safe-area-inset-bottom))!important}
`;

export type BarSocial = { key: string; name: string; href: string | null };
export type BarConfig = { active: string; name: string; loggedIn: boolean; courseHref: string | null; socials: BarSocial[] };

const ICONS: Record<string, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  task: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  books: '<path d="M5 4h14v13H6.5A1.5 1.5 0 0 0 5 18.5z"/><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3M9 8h6"/>',
  course: '<circle cx="12" cy="12" r="9"/><path d="m10.5 8.8 4.5 3.2-4.5 3.2z"/>',
  prof: '<circle cx="12" cy="8.5" r="3.7"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
};
const ITEMS: [string, string][] = [["home", "Home"], ["task", "Task"], ["books", "Books"], ["course", "Course"], ["prof", "Profile"]];

// Task page mein bar (HTML + CSS + chhota script). Data localStorage-shim se asli aata hai.
export function bottomBarForTaskPage(cfg: BarConfig): string {
  const json = JSON.stringify(cfg).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const items = ITEMS.map(([k, n]) =>
    `<button type="button" class="nbi" data-k="${k}"><span class="pl"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg></span>${n}</button>`).join("");
  return `<style id="nb-css">${BOTTOM_BAR_CSS}${STANDALONE_CSS}</style>
<nav class="nb" id="nb" aria-label="Main navigation"><span class="nbp" aria-hidden="true"></span>${items}</nav>
<div class="nsh" id="nsh" hidden><div class="nsh-bd" data-close></div>
<section class="nsh-pn" role="dialog" aria-modal="true" aria-labelledby="nshT"><button type="button" class="nsh-x" data-close aria-label="Profile band karo">&#10005;</button>
<div class="nsh-top"><div class="nsh-av" id="nshAv">S</div><div><div class="nsh-t" id="nshT"></div><div class="nsh-s" id="nshS"></div></div></div>
<div class="nsh-pl"><span>Daily progress</span><b id="nshTk"></b></div><div class="nsh-tr"><i id="nshBar"></i></div>
<div class="nsh-st"><div><b id="nshD"></b><span>Tasks done</span></div><div><b id="nshSt"></b><span>Streak</span></div><div><b id="nshPc"></b><span>Complete</span></div></div>
<div class="nsh-ac" id="nshAc"></div><div class="nsh-h">Join community</div><div class="nsh-so" id="nshSo"></div></section></div>
<div id="nbToast" role="status" aria-live="polite"></div>
<script>(function(){
var C=${json},$=function(i){return document.getElementById(i)},bar=$("nb"),pill=bar.querySelector(".nbp"),
btns=[].slice.call(bar.querySelectorAll(".nbi")),sh=$("nsh"),to=$("nbToast"),open=false,tt;
var LINKS={home:"/",task:"/tasks",books:"/books",course:C.courseHref};
C.socials.forEach(function(s){LINKS[s.key]=s.href});
function vib(){try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}}
function say(m){to.textContent=m;to.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){to.classList.remove("on")},2300)}
function place(){var k=open?"prof":C.active,cur=null;
 btns.forEach(function(b){var on=b.getAttribute("data-k")===k;b.classList.toggle("on",on);if(on){cur=b;b.setAttribute("aria-current","true")}else b.removeAttribute("aria-current")});
 if(cur){pill.style.width=cur.offsetWidth+"px";pill.style.transform="translateX("+cur.offsetLeft+"px)";pill.style.opacity=1}else pill.style.opacity=0}
function go(u,name){if(!u){say(name+" ka link abhi set nahi hai");return}
 if(/^https?:/.test(u))window.open(u,"_blank","noopener,noreferrer");else location.href=u}
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function read(k){try{return JSON.parse(localStorage.getItem("studyUniverse."+k+".v1"))}catch(e){return null}}
function fill(){
 var t=read("tasks"),dn=read("done"),total=Array.isArray(t)?t.length:24,
  done=dn&&dn.date===ymd(new Date())&&Array.isArray(dn.ids)?dn.ids.length:0,
  streak=window.__SUX?window.__SUX.streakFor({size:done}):0,pc=total?Math.round(done/total*100):0;
 $("nshT").textContent=C.name;$("nshS").textContent=C.loggedIn?"Member \\u2022 Jai Shri Krishna":"Guest \\u2022 Login karo, progress save rahegi";
 $("nshAv").textContent=(C.name||"S").charAt(0).toUpperCase();$("nshTk").textContent=done+"/"+total+" tasks";
 $("nshD").textContent=done;$("nshSt").textContent=streak;$("nshPc").textContent=pc+"%";
 $("nshBar").style.width="0";setTimeout(function(){$("nshBar").style.width=pc+"%"},60)}
$("nshAc").innerHTML=C.loggedIn?'<a href="/profile">Poori Profile</a><a href="/results">Results</a>':'<a href="/login?next=/tasks">Login</a><a href="/signup">Signup</a>';
$("nshSo").innerHTML=C.socials.map(function(s){return '<button type="button" data-s="'+s.key+'" data-n="'+s.name+'">'+s.name+'</button>'}).join("");
function openS(){fill();sh.hidden=false;void sh.offsetWidth;sh.classList.add("open");open=true;place()}
function closeS(){if(!open)return;open=false;sh.classList.remove("open");place();setTimeout(function(){if(!open)sh.hidden=true},320)}
bar.addEventListener("click",function(e){var b=e.target.closest(".nbi");if(!b)return;vib();var k=b.getAttribute("data-k");
 if(k==="prof"){open?closeS():openS();return}closeS();
 if(k===C.active)return;go(LINKS[k],b.textContent.trim())});
sh.addEventListener("click",function(e){if(e.target.closest("[data-close]")){vib();closeS();return}
 var s=e.target.closest("[data-s]");if(!s)return;vib();go(LINKS[s.getAttribute("data-s")],s.getAttribute("data-n"))});
addEventListener("keydown",function(e){if(e.key==="Escape")closeS()});
addEventListener("resize",place);addEventListener("load",place);place();
})();</script>`;
}

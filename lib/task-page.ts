import { TASK_TEMPLATE } from "./task-template";
import { bottomBarForTaskPage } from "./bottom-bar";

export type TaskPageCtx = { loggedIn: boolean; courseHref: string | null };
type Boot = { mode: "server" | "local"; uid?: string; data?: Record<string, string> };

// Website ka Header + Bottom navigation (Task page ke andar, taaki ye poori website ka hissa lage)
const SITE_CSS = `
.bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:
radial-gradient(circle at 10% 0%,rgba(16,185,129,.2),transparent 45%),
radial-gradient(circle at 95% 100%,rgba(255,107,0,.15),transparent 45%),
radial-gradient(circle at 50% 45%,rgba(212,175,55,.1),transparent 50%),
linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px) 0 0/32px 32px,
linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px) 0 0/32px 32px}
.bg:before,.bg:after{content:"";position:absolute;width:55vmax;height:55vmax;border-radius:50%}
.bg:before{top:-22vmax;left:-16vmax;background:radial-gradient(circle,rgba(16,185,129,.32),transparent 65%)}
.bg:after{bottom:-26vmax;right:-16vmax;background:radial-gradient(circle,rgba(212,175,55,.26),transparent 65%)}
.bg:before{animation:drift 18s ease-in-out infinite alternate}.bg:after{animation:drift 22s ease-in-out infinite alternate-reverse}
@keyframes drift{to{transform:translate(8vmax,6vmax) scale(1.15)}}
#root>div{background:transparent!important}
#root>div>div.fixed.inset-0.z-0{display:none!important}
.sx-hd{position:sticky;top:0;z-index:60;padding:calc(8px + env(safe-area-inset-top)) 0 8px;background:rgba(2,6,3,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(212,175,55,.25);font-family:Outfit,system-ui,sans-serif}
.sx-in{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:1280px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-left)) 0 max(16px,env(safe-area-inset-right))}
.sx-brand{display:flex;align-items:center;gap:12px;min-width:0;text-decoration:none}
.sx-logo{width:42px;height:42px;border-radius:50%;overflow:hidden;flex:none;border:2px solid #D4AF37;box-shadow:0 0 18px rgba(212,175,55,.5)}
.sx-logo img{width:100%;height:100%;object-fit:cover;display:block}
.sx-ttl{font:700 20px/1.1 Outfit,system-ui,sans-serif;background:linear-gradient(90deg,#fff,#FFE082,#FFD700,#FFA726);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.sx-nav{display:none;gap:4px}
.sx-nav a{padding:8px 14px;border-radius:99px;font-size:14px;font-weight:600;color:#a1a1aa;text-decoration:none;transition:.25s}
.sx-nav a:hover,.sx-nav a.on{color:#000;background:linear-gradient(90deg,#FFE082,#FFD700)}
.sx-me{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);display:grid;place-items:center;flex:none;text-decoration:none;font-size:16px}
.sx-bn{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;justify-content:space-around;padding:6px 8px calc(6px + env(safe-area-inset-bottom));background:rgba(2,6,3,.95);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-top:1px solid rgba(212,175,55,.25);font-family:Outfit,system-ui,sans-serif}
.sx-bn a{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 10px;border-radius:12px;color:#a1a1aa;font-size:18px;text-decoration:none}
.sx-bn a small{font-size:10.5px;font-weight:600}
.sx-bn a.on{color:#FFD700;background:rgba(212,175,55,.12)}
.sx-gst{max-width:1280px;margin:10px auto 0;padding:10px 14px;border-radius:14px;font:600 13px/1.5 Outfit,system-ui,sans-serif;color:#a1a1aa;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);position:relative;z-index:5}
.sx-gst a{color:#FFD700;font-weight:700}
@media(min-width:900px){.sx-nav{display:flex}.sx-bn{display:none}}
`;

function chrome(ctx: TaskPageCtx): string {
  const loggedIn = ctx.loggedIn;
  const guest = loggedIn ? "" : `<div class="sx-gst">⚠️ Login के बिना Tasks सिर्फ़ इसी फोन में रहेंगे। <a href="/login?next=/tasks">Login करो</a> ताकि हर जगह मिलें।</div>`;
  return `<style id="sx-css">${SITE_CSS}</style>
<div class="bg" aria-hidden="true"></div>
<header class="sx-hd"><div class="sx-in"><a class="sx-brand" href="/" aria-label="Study Universe Home"><span class="sx-logo"><img src="/images/logo.webp" alt="Study Universe Logo" width="42" height="42"></span><span class="sx-ttl">Study Universe</span></a><a class="sx-me" href="/profile" aria-label="Profile">👤</a></div></header>${guest}${bottomBarForTaskPage({ active: "task", courseHref: ctx.courseHref })}`;
}

// Page ke andar localStorage ki jagah ye lagta hai: data server par save hota hai (login) ya phone mein (guest).
// Streak: roz kam se kam 1 task complete = 1 din.
const STORAGE_SHIM = `
(function(){
  var B=window.__SU_BOOT||{mode:"local"},PFX="studyUniverse.",HK="studyUniverse.hist.v1",MAX=1800000;
  var real=null;try{real=window.localStorage}catch(e){}
  var TK="studyUniverse.tasks.v1",IMGK="suPhotos:"+(B.uid||"guest"),imgs={};
  try{imgs=JSON.parse(real.getItem(IMGK)||"{}")||{}}catch(e){imgs={}}
  var mem={},timer=null,dirty=false,k,i;
  if(B.mode==="server"){var d=B.data||{};for(k in d){if(k.indexOf(PFX)===0&&typeof d[k]==="string")mem[k]=d[k]}}
  else if(real){try{for(i=0;i<real.length;i++){k=real.key(i);if(k&&k.indexOf(PFX)===0)mem[k]=real.getItem(k)}}catch(e){}}
  // Cover photo (task.photo) server par nahi jati: is phone ki local storage mein alag rakhi jati hai.
  function saveImgs(){if(real)real.setItem(IMGK,JSON.stringify(imgs))}
  function strip(json){
    try{var a=JSON.parse(json);if(!Array.isArray(a))return json;var seen={},i2,t2,id;
      for(i2=0;i2<a.length;i2++){t2=a[i2];if(!t2||typeof t2!=="object")continue;id=String(t2.id);seen[id]=1;
        if(typeof t2.photo==="string"&&t2.photo){imgs[id]=t2.photo;t2.photo=""}}
      for(id in imgs){if(!seen[id])delete imgs[id]}
      return JSON.stringify(a)}catch(e){return json}}
  function withPhotos(json){
    try{var a=JSON.parse(json);if(!Array.isArray(a))return json;var i2,t2;
      for(i2=0;i2<a.length;i2++){t2=a[i2];if(t2&&!t2.photo&&imgs[String(t2.id)])t2.photo=imgs[String(t2.id)]}
      return JSON.stringify(a)}catch(e){return json}}
  if(mem[TK]){var s0=strip(mem[TK]);if(s0!==mem[TK]){mem[TK]=s0;try{saveImgs()}catch(e){}if(B.mode==="server"){dirty=true}else local(TK,s0)}}
  function size(){var n=0,x;for(x in mem)n+=x.length+mem[x].length;return n}
  function local(k,v){if(!real)return;if(v===null)real.removeItem(k);else real.setItem(k,v)}
  function flush(unload){
    if(B.mode!=="server"||!dirty)return;dirty=false;clearTimeout(timer);
    var body=JSON.stringify({data:mem}),opt={method:"POST",headers:{"Content-Type":"application/json"},body:body,credentials:"same-origin"};
    if(unload&&body.length<60000)opt.keepalive=true;
    fetch("/api/task-sync",opt).then(function(r){if(!r.ok)dirty=true}).catch(function(){dirty=true});
  }
  function sched(){if(B.mode!=="server")return;dirty=true;clearTimeout(timer);timer=setTimeout(function(){flush(false)},1200)}
  function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
  function hist(v){try{var o=JSON.parse(v);if(o&&o.date&&Array.isArray(o.ids)){var h=JSON.parse(mem[HK]||"{}"),ks;h[o.date]=o.ids.length;ks=Object.keys(h).sort();while(ks.length>400)delete h[ks.shift()];mem[HK]=JSON.stringify(h);if(B.mode!=="server")local(HK,mem[HK])}}catch(e){}}
  var shim={
    getItem:function(k){k=String(k);if(k.indexOf(PFX)!==0)return real?real.getItem(k):null;if(!Object.prototype.hasOwnProperty.call(mem,k))return null;return k===TK?withPhotos(mem[k]):mem[k]},
    setItem:function(k,v){k=String(k);v=String(v);
      if(k.indexOf(PFX)!==0){if(real)real.setItem(k,v);return}
      var oldImgs=null;
      if(k===TK){oldImgs=JSON.stringify(imgs);v=strip(v);try{saveImgs()}catch(e){imgs=JSON.parse(oldImgs);throw new Error("QuotaExceededError")}}
      var old=mem[k];mem[k]=v;
      if(size()>MAX){if(old===undefined)delete mem[k];else mem[k]=old;if(oldImgs!==null){imgs=JSON.parse(oldImgs);try{saveImgs()}catch(e){}}throw new Error("QuotaExceededError")}
      if(k==="studyUniverse.done.v1")hist(v);
      if(B.mode==="server")sched();else local(k,v)},
    removeItem:function(k){k=String(k);if(k.indexOf(PFX)!==0){if(real)real.removeItem(k);return}delete mem[k];if(B.mode==="server")sched();else local(k,null)},
    clear:function(){},key:function(){return null}
  };
  Object.defineProperty(shim,"length",{get:function(){return 0}});
  try{Object.defineProperty(window,"localStorage",{configurable:true,get:function(){return shim}})}catch(e){}
  if(dirty)sched();
  window.addEventListener("pagehide",function(){flush(true)});
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flush(true)});
  window.__SUX={streakFor:function(set){
    var h={};try{h=JSON.parse(mem[HK]||"{}")}catch(e){}
    var d=new Date();h[ymd(d)]=set&&set.size?set.size:0;
    if(!h[ymd(d)])d.setDate(d.getDate()-1);
    var s=0;while(h[ymd(d)]>0){s++;d.setDate(d.getDate()-1)}
    return s}};
})();`;

export function renderTaskPage(boot: Boot, ctx: TaskPageCtx): string {
  const json = JSON.stringify(boot).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const boot_ = `<script>window.__SU_BOOT=${json};</script><script>${STORAGE_SHIM}</script>`;
  return TASK_TEMPLATE
    .replace("<!--SU_BOOT-->", () => boot_)
    .replace("<!--SU_SITE-->", () => chrome(ctx));
}

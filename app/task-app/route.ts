import { TASK_TEMPLATE } from "@/lib/task-template";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Original Task page + login user ka apna data (har user ka alag). Login nahi to purani tarah phone ki memory (guest mode).
export async function GET() {
  const user = await getUser();
  let boot: { mode: "server" | "local"; data?: Record<string, string> } = { mode: "local" };

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("user_task_data").select("data").eq("user_id", user.id).maybeSingle();
    boot = { mode: "server", data: ((data as { data: Record<string, string> } | null)?.data) ?? {} };
  }

  const json = JSON.stringify(boot).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const shim = `<script>window.__SU_BOOT=${json};</script><script>${STORAGE_SHIM}</script>`;
  const html = TASK_TEMPLATE.replace("<!--SU_BOOT-->", () => shim);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

// Page ke andar localStorage ki jagah ye lagta hai: data server par save hota hai (login) ya phone mein (guest).
// Streak: roz kam se kam 1 task complete = 1 din.
const STORAGE_SHIM = `
(function(){
  var B=window.__SU_BOOT||{mode:"local"},PFX="studyUniverse.",HK="studyUniverse.hist.v1",MAX=1800000;
  var real=null;try{real=window.localStorage}catch(e){}
  var mem={},timer=null,dirty=false,k,i;
  if(B.mode==="server"){var d=B.data||{};for(k in d){if(k.indexOf(PFX)===0&&typeof d[k]==="string")mem[k]=d[k]}}
  else if(real){try{for(i=0;i<real.length;i++){k=real.key(i);if(k&&k.indexOf(PFX)===0)mem[k]=real.getItem(k)}}catch(e){}}
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
    getItem:function(k){k=String(k);if(k.indexOf(PFX)!==0)return real?real.getItem(k):null;return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null},
    setItem:function(k,v){k=String(k);v=String(v);
      if(k.indexOf(PFX)!==0){if(real)real.setItem(k,v);return}
      var old=mem[k];mem[k]=v;
      if(size()>MAX){if(old===undefined)delete mem[k];else mem[k]=old;throw new Error("QuotaExceededError")}
      if(k==="studyUniverse.done.v1")hist(v);
      if(B.mode==="server")sched();else local(k,v)},
    removeItem:function(k){k=String(k);if(k.indexOf(PFX)!==0){if(real)real.removeItem(k);return}delete mem[k];if(B.mode==="server")sched();else local(k,null)},
    clear:function(){},key:function(){return null}
  };
  Object.defineProperty(shim,"length",{get:function(){return 0}});
  try{Object.defineProperty(window,"localStorage",{configurable:true,get:function(){return shim}})}catch(e){}
  window.addEventListener("pagehide",function(){flush(true)});
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flush(true)});
  window.__SUX={streakFor:function(set){
    var h={};try{h=JSON.parse(mem[HK]||"{}")}catch(e){}
    var d=new Date();h[ymd(d)]=set&&set.size?set.size:0;
    if(!h[ymd(d)])d.setDate(d.getDate()-1);
    var s=0;while(h[ymd(d)]>0){s++;d.setDate(d.getDate()-1)}
    return s}};
})();`;

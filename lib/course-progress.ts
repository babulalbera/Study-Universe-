// Padhai ka hisaab: kaun se lecture complete, video kahan tak dekha, speed, auto-next.
// Phone/browser me (localStorage) save hota hai. Login ho to "complete" ka hisaab Supabase me bhi jata hai,
// taaki kisi bhi mobile par wahi ✓ dikhe. Sirf browser me chalta hai (components "use client" se import karo).
import { createClient } from "@/lib/supabase/client";

const DONE_EVENT = "cv-done-change";
const TABLE = "course_video_progress";

export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const nextRate = (r: number) => RATES[(RATES.indexOf(r) + 1) % RATES.length] ?? 1;
// Keyboard ke "<" ">" ke liye: ek kadam upar/neeche (kinare par ruk jata hai)
export const stepRate = (r: number, d: 1 | -1) => RATES[Math.min(RATES.length - 1, Math.max(0, RATES.indexOf(r) + d))] ?? 1;

const get = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const set = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* storage band ho to chalta hai */ }
};

export function getDone(courseId: string): string[] {
  try {
    const raw: unknown = JSON.parse(get(`cv-done:${courseId}`) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function setDone(courseId: string, videoId: string, on: boolean) {
  const cur = new Set(getDone(courseId));
  if (on) cur.add(videoId);
  else cur.delete(videoId);
  set(`cv-done:${courseId}`, JSON.stringify([...cur]));
  window.dispatchEvent(new CustomEvent(DONE_EVENT, { detail: { courseId } }));
  void pushDone(courseId, videoId, on); // login ho to server par bhi
}

// Complete-list badle (isi tab me ya doosre tab me) to cb chalao
export function onDoneChange(courseId: string, cb: () => void): () => void {
  const same = (e: Event) => {
    if ((e as CustomEvent<{ courseId?: string }>).detail?.courseId === courseId) cb();
  };
  const other = (e: StorageEvent) => {
    if (e.key === `cv-done:${courseId}`) cb();
  };
  window.addEventListener(DONE_EVENT, same);
  window.addEventListener("storage", other);
  return () => {
    window.removeEventListener(DONE_EVENT, same);
    window.removeEventListener("storage", other);
  };
}

// ---- Login ke saath sync (Supabase table: course_video_progress) ----
async function session() {
  try {
    const { data } = await createClient().auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

async function pushDone(courseId: string, videoId: string, on: boolean) {
  try {
    const se = await session();
    if (!se) return; // login nahi: sirf is phone me
    const sb = createClient();
    if (on) await sb.from(TABLE).upsert({ user_id: se.user.id, course_id: courseId, video_id: videoId }, { onConflict: "user_id,video_id", ignoreDuplicates: true });
    else await sb.from(TABLE).delete().eq("user_id", se.user.id).eq("video_id", videoId);
  } catch { /* net na ho to phone me to save hai */ }
}

async function run(courseId: string) {
  const se = await session();
  if (!se) return;
  const sb = createClient();
  const uid = se.user.id;
  const flag = `cv-synced:${uid}:${courseId}`;
  if (!get(flag)) {
    // Pehli baar: is phone ke purane "complete" server par bhejo (jo video ab hai hi nahi, unhe chhod ke)
    const mine = getDone(courseId);
    if (mine.length) {
      const { data: vids } = await sb.from("course_videos").select("id").eq("course_id", courseId).limit(1000);
      const valid = new Set(((vids ?? []) as { id: string }[]).map((v) => v.id));
      const rows = mine.filter((x) => valid.has(x)).map((v) => ({ user_id: uid, course_id: courseId, video_id: v }));
      if (rows.length) {
        const { error } = await sb.from(TABLE).upsert(rows, { onConflict: "user_id,video_id", ignoreDuplicates: true });
        if (error) return; // table nahi bani / net nahi: local hi rehne do
      }
    }
    set(flag, "1");
  }
  // Ab server ka hisaab hi sahi maana jata hai (kisi bhi mobile par kiya hua yahan aa jata hai)
  const { data, error } = await sb.from(TABLE).select("video_id").eq("course_id", courseId).limit(2000);
  if (error || !data) return;
  const remote = (data as { video_id: string }[]).map((r) => r.video_id);
  const before = getDone(courseId);
  if (remote.length === before.length && remote.every((x) => before.includes(x))) return;
  set(`cv-done:${courseId}`, JSON.stringify(remote));
  window.dispatchEvent(new CustomEvent(DONE_EVENT, { detail: { courseId } }));
}

const inflight = new Map<string, Promise<void>>();
// Login ho to server se "complete" ka hisaab laao (ek course ke liye ek hi baar ek saath)
export function syncDone(courseId: string): Promise<void> {
  const cur = inflight.get(courseId);
  if (cur) return cur;
  const p = run(courseId).catch(() => undefined).finally(() => inflight.delete(courseId));
  inflight.set(courseId, p);
  return p;
}

export const getPos = (videoId: string) => Number(get(`cv-t:${videoId}`)) || 0;
export const savePos = (videoId: string, sec: number) => set(`cv-t:${videoId}`, String(Math.floor(sec)));
export const clearPos = (videoId: string) => {
  try { localStorage.removeItem(`cv-t:${videoId}`); } catch { /* chalta hai */ }
};

export function getRate(): number {
  const r = Number(get("cv-rate"));
  return RATES.includes(r) ? r : 1;
}
export const saveRate = (r: number) => set("cv-rate", String(r));

export const getAutoNext = () => get("cv-autonext") !== "0"; // pehle se ON
export const saveAutoNext = (on: boolean) => set("cv-autonext", on ? "1" : "0");

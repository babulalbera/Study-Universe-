// Padhai ka hisaab, isi phone/browser me (localStorage): kaun se lecture complete, video kahan tak dekha, speed, auto-next.
// Sirf browser me chalta hai (components "use client" se import karo).
const DONE_EVENT = "cv-done-change";

export const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
export const nextRate = (r: number) => RATES[(RATES.indexOf(r) + 1) % RATES.length] ?? 1;

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

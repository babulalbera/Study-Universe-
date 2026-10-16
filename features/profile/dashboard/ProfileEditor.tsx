"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { EXAMS, SUBJECTS } from "@/lib/profile-options";
import { removeAvatar, setAvatar, updateDetails } from "./actions";
import type { FullProfile } from "./queries";
import type { FormState } from "../types";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Photo ko 512px tak chhota karke JPEG banata hai (jaldi upload, kam data)
function shrink(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 512 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => { URL.revokeObjectURL(url); if (b) resolve(b); else reject(new Error("blob")); }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
    img.src = url;
  });
}

const snapshot = (form: HTMLFormElement) => {
  const f = new FormData(form);
  return JSON.stringify([...f.entries()].map(([k, v]) => [k, String(v)]).sort());
};

export default function ProfileEditor({ p, onDirty }: { p: FullProfile; onDirty?: (d: boolean) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(updateDetails, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const base = useRef("");
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [askRemove, setAskRemove] = useState(false);

  const done = [Boolean(p.hasAvatar), p.fullName.trim().length >= 2, Boolean(p.phone), Boolean(p.targetExam), Boolean(p.examDate), p.subjects.length > 0];
  const pct = Math.round((done.filter(Boolean).length / done.length) * 100);

  useEffect(() => { if (formRef.current) base.current = snapshot(formRef.current); }, [formKey, p]);
  useEffect(() => { if (state.message) setDirty(false); }, [state.message]);
  useEffect(() => { onDirty?.(dirty); }, [dirty, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES.includes(file.type)) return setMsg({ ok: false, text: "Sirf JPG, PNG ya WebP photo chalegi" });
    if (file.size > 10 * MAX_BYTES) return setMsg({ ok: false, text: "Photo bahut badi hai (10MB se kam ho)" });
    setBusy(true); setMsg(null);
    try {
      const blob = await shrink(file);
      if (blob.size > MAX_BYTES) throw new Error("size");
      const path = `${p.id}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const up = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw new Error("upload");
      const r = await setAvatar(path);
      if (r.error) { await supabase.storage.from("avatars").remove([path]); throw new Error(r.error); }
      setMsg({ ok: true, text: "Photo badal gayi ✓" });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Photo upload nahi hui. Dusri photo ya baad mein koshish karo." });
    } finally { setBusy(false); }
  }

  async function doRemove() {
    setAskRemove(false); setBusy(true); setMsg(null);
    const r = await removeAvatar();
    setBusy(false);
    if (r.error) setMsg({ ok: false, text: r.error });
    else { setMsg({ ok: true, text: "Photo hata di ✓" }); router.refresh(); }
  }

  return (
    <div>
      <div className="set-photo">
        {p.avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="set-av" src={p.avatarUrl} alt="Meri profile photo" />
          : <div className="set-av set-av-ph" aria-hidden="true">{(p.fullName || "S").charAt(0).toUpperCase()}</div>}
        <div className="pd-row" style={{ marginTop: 0 }}>
          <button type="button" className="pbtn pbtn-ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Ruko…" : p.hasAvatar ? "📷 Photo badlo" : "📷 Photo lagao"}
          </button>
          {p.hasAvatar && <button type="button" className="pbtn pbtn-ghost" disabled={busy} onClick={() => setAskRemove(true)}>🗑 Hatao</button>}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} hidden />
        </div>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "pd-ok" : "pd-warn"}>{msg.text}</p>}

      <div className="pd-meter" aria-label={`Profile ${pct}% poori`}>
        <div className="pd-mlabel"><span>Profile completion</span><b>{pct}%</b></div>
        <div className="pd-track"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <form key={formKey} ref={formRef} action={action} className="pd-form" noValidate style={{ marginTop: 14 }}
        onInput={() => formRef.current && setDirty(snapshot(formRef.current) !== base.current)}>
        <Input label="Naam" name="full_name" defaultValue={p.fullName} error={fe.full_name} required />
        <Input label="Mobile number (zaroori nahi)" name="phone" type="tel" inputMode="tel" defaultValue={p.phone} error={fe.phone} placeholder="98XXXXXXXX" />
        <label className="su-field"><span>Lakshya pariksha</span>
          <select name="target_exam" defaultValue={p.targetExam}>
            <option value="">— chuno —</option>
            {EXAMS.map((x) => <option key={x} value={x}>{x === "Anya" ? "Anya (Other)" : x}</option>)}
          </select>
          {fe.target_exam && <em role="alert">{fe.target_exam}</em>}
        </label>
        <Input label="Pariksha ki tareekh (agar pata ho)" name="exam_date" type="date" defaultValue={p.examDate ?? ""} error={fe.exam_date} />
        <Input label="Roz ka study goal (minute)" name="daily_goal_minutes" type="number" min={15} max={1440} step={15} defaultValue={p.dailyGoal} error={fe.daily_goal_minutes} />
        <fieldset className="pd-chips"><legend>Pasandida vishay</legend>
          {SUBJECTS.map((s) => (
            <label key={s} className="pd-chip"><input type="checkbox" name="subjects" value={s} defaultChecked={p.subjects.includes(s)} /><span>{s}</span></label>
          ))}
        </fieldset>
        <div className="pd-row">
          <button type="submit" className="pbtn pbtn-gold" disabled={pending || !dirty}>{pending ? "Save ho raha hai…" : "Save Changes"}</button>
          <button type="button" className="pbtn pbtn-ghost" disabled={pending} onClick={() => { setFormKey((k) => k + 1); setDirty(false); }}>Cancel</button>
        </div>
        {dirty && <p className="pd-warn">Kuch badlav save nahi hue hain.</p>}
        {state.error && <p role="alert" className="pd-warn">{state.error}</p>}
        {state.message && !dirty && <p role="status" className="pd-ok">{state.message}</p>}
      </form>

      <ConfirmDialog open={askRemove} title="Photo hatani hai?" text="Profile photo hat jayegi aur Storage se bhi delete ho jayegi." onCancel={() => setAskRemove(false)} onConfirm={doRemove} />
    </div>
  );
}

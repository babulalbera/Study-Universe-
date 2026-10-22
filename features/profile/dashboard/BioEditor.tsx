"use client";
import { useActionState, useState } from "react";
import { saveBio } from "./settings-actions";
import type { FormState } from "../types";

export default function BioEditor({ bio }: { bio: string }) {
  const [st, act, pend] = useActionState<FormState, FormData>(saveBio, {});
  const [val, setVal] = useState(bio);
  return (
    <form action={act} className="pd-form" noValidate style={{ marginTop: 14 }}>
      <label className="su-field"><span>Bio (profile card ki ek chhoti line)</span>
        <input name="bio" maxLength={120} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Big dreams need daily efforts." />
        <small className="pd-dim">{val.length}/120</small>
        {st.fieldErrors?.bio && <em role="alert">{st.fieldErrors.bio}</em>}
      </label>
      <button type="submit" className="pbtn pbtn-gold" disabled={pend}>{pend ? "Save ho raha hai…" : "Bio Save karo"}</button>
      {st.error && <p role="alert" className="pd-warn">{st.error}</p>}
      {st.message && <p role="status" className="pd-ok">{st.message}</p>}
    </form>
  );
}

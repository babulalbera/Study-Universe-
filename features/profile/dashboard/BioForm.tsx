"use client";
import { useActionState, useState } from "react";
import { updateBio } from "./bio-actions";
import type { FormState } from "../types";

export default function BioForm({ bio }: { bio: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateBio, {});
  const [val, setVal] = useState(bio);
  return (
    <form action={action} className="pd-form pr-bioform" noValidate>
      <label className="su-field">
        <span>Mera Quote / Bio <small>({val.length}/120)</small></span>
        <textarea name="bio" rows={2} maxLength={120} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Big dreams need daily efforts." />
        {state.fieldErrors?.bio ? <em role="alert">{state.fieldErrors.bio}</em> : null}
      </label>
      <div className="pd-row">
        <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "Save ho raha hai…" : "Bio Save Karo"}</button>
      </div>
      {state.error ? <p role="alert" className="pd-warn">{state.error}</p> : null}
      {state.message ? <p role="status" className="pd-ok">{state.message}</p> : null}
    </form>
  );
}

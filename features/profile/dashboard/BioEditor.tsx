"use client";
import { useActionState } from "react";
import { saveBio } from "./prefs-actions";
import type { FormState } from "../types";

export default function BioEditor({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBio, {});
  return (
    <form action={action} className="pd-form pr-bio-form">
      <label className="su-field">
        Meri chhoti line (Profile card par dikhti hai)
        <input name="bio" defaultValue={initial} maxLength={120} placeholder="Big dreams need daily efforts." />
        {state.fieldErrors?.bio ? <em>{state.fieldErrors.bio}</em> : null}
      </label>
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "Save ho raha hai..." : "Bio save karo"}</button>
      {state.message ? <p className="pd-ok">{state.message}</p> : null}
      {state.error ? <p className="pd-warn">{state.error}</p> : null}
    </form>
  );
}

"use client";
import { useActionState, useEffect, useState } from "react";
import { submitReport } from "./actions";
import type { FormState } from "../types";

export default function ReportForm() {
  const [st, action, pending] = useActionState<FormState, FormData>(submitReport, {});
  const [k, setK] = useState(0);
  useEffect(() => { if (st.message) setK((x) => x + 1); }, [st]);
  const fe = st.fieldErrors ?? {};
  return (
    <form key={k} action={action} className="pd-form" noValidate>
      <label className="su-field"><span>Kis bare mein?</span>
        <select name="category" defaultValue="bug">
          <option value="bug">Website mein gadbad (Bug)</option><option value="content">Content / Book / Test ki samasya</option>
          <option value="account">Account ki samasya</option><option value="other">Kuch aur</option>
        </select>{fe.category && <em role="alert">{fe.category}</em>}
      </label>
      <label className="su-field"><span>Samasya likho (kam se kam 10 akshar)</span><textarea name="message" rows={4} maxLength={2000} required />{fe.message && <em role="alert">{fe.message}</em>}</label>
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "Ruko…" : "Report bhejo"}</button>
      {st.error && <p role="alert" className="pd-warn">{st.error}</p>}
      {st.message && <p role="status" className="pd-ok">{st.message}</p>}
    </form>
  );
}

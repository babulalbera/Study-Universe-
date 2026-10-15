"use client";
import { useActionState } from "react";
import { saveNotifPrefs } from "./actions";
import type { NotifyPrefs } from "./queries";
import type { FormState } from "../types";

export default function NotifPrefsForm({ prefs }: { prefs: NotifyPrefs }) {
  const [st, action, pending] = useActionState<FormState, FormData>(saveNotifPrefs, {});
  return (
    <form action={action} className="pd-form">
      <label className="adm-chk"><input type="checkbox" name="new_content" defaultChecked={prefs.new_content} /> Nayi Books aur Tests ki suchna (is page par dikhti hai)</label>
      <label className="adm-chk"><input type="checkbox" name="daily_reminder" defaultChecked={prefs.daily_reminder} /> Roz padhai ka reminder</label>
      <label className="adm-chk"><input type="checkbox" name="goal_reminder" defaultChecked={prefs.goal_reminder} /> Goal ka reminder</label>
      <p className="pd-note">Dhyan do: Reminders ki pasand abhi sirf save hoti hai. Asli reminder bhejne ke liye Email ya Push service (jaise Resend, Firebase) jodni padegi, jo abhi configure nahi hai. Isliye abhi koi reminder nahi bheja jata.</p>
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "Ruko…" : "Pasand save karo"}</button>
      {st.error && <p role="alert" className="pd-warn">{st.error}</p>}
      {st.message && <p role="status" className="pd-ok">{st.message}</p>}
    </form>
  );
}

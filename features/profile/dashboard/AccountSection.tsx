"use client";
import { useActionState, useState } from "react";
import { changeEmail, changePassword, deleteAccount, logoutAll, requestPasswordReset } from "./actions";
import { logout } from "../actions";
import type { FormState } from "../types";
import type { FullProfile } from "./queries";

function Msg({ st }: { st: FormState }) {
  return (<>{st.error && <p role="alert" className="pd-warn">{st.error}</p>}{st.message && <p role="status" className="pd-ok">{st.message}</p>}</>);
}
function F({ label, name, type = "text", err, auto }: { label: string; name: string; type?: string; err?: string; auto?: string }) {
  return (<label className="su-field"><span>{label}</span><input name={name} type={type} autoComplete={auto} required />{err && <em role="alert">{err}</em>}</label>);
}

export default function AccountSection({ p }: { p: FullProfile }) {
  const [pw, pwAct, pwPend] = useActionState<FormState, FormData>(changePassword, {});
  const [em, emAct, emPend] = useActionState<FormState, FormData>(changeEmail, {});
  const [rs, rsAct, rsPend] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const [del, delAct, delPend] = useActionState<FormState, FormData>(deleteAccount, {});
  const [confirmDel, setConfirmDel] = useState(false);
  const last = p.lastSignIn ? new Date(p.lastSignIn).toLocaleString("hi-IN") : "—";

  return (
    <section id="account" className="pd-card">
      <h2 className="pd-h">⚙️ Account Settings</h2>
      <div className="pd-kv">
        <span>Email</span><b>{p.email} {p.emailVerified ? <em className="pd-ok">✓ Verified</em> : <em className="pd-warn">Verify nahi hua</em>}</b>
        <span>Login ka tareeka</span><b>{p.provider}</b>
        <span>Aakhri Login</span><b>{last}</b>
      </div>
      <p className="pd-dim">Supabase user ke sabhi Login sessions ki suchi nahi deta, isliye sirf aakhri Login dikhta hai. Neeche &quot;Sab Devices se Logout&quot; se sabhi sessions band ho jate hain.</p>

      <details className="pd-edit"><summary>🔑 Password badlo</summary>
        <form action={pwAct} className="pd-form" noValidate>
          <F label="Abhi ka password" name="current" type="password" err={pw.fieldErrors?.current} auto="current-password" />
          <F label="Naya password (kam se kam 8 akshar)" name="next" type="password" err={pw.fieldErrors?.next} auto="new-password" />
          <F label="Naya password dobara" name="again" type="password" err={pw.fieldErrors?.again} auto="new-password" />
          <button type="submit" className="pbtn pbtn-gold" disabled={pwPend}>{pwPend ? "Ruko…" : "Password badlo"}</button><Msg st={pw} />
        </form>
        <form action={rsAct} className="pd-form" style={{ marginTop: 10 }}>
          <button type="submit" className="pbtn pbtn-ghost" disabled={rsPend}>Password bhool gaye? Reset Link Email par bhejo</button><Msg st={rs} />
        </form>
      </details>

      <details className="pd-edit"><summary>✉️ Email badlo</summary>
        <form action={emAct} className="pd-form" noValidate>
          <F label="Naya Email" name="email" type="email" err={em.fieldErrors?.email} auto="email" />
          <button type="submit" className="pbtn pbtn-gold" disabled={emPend}>{emPend ? "Ruko…" : "Confirm Link bhejo"}</button><Msg st={em} />
        </form>
      </details>

      <div className="pd-row">
        <form action={logout}><button type="submit" className="pbtn pbtn-ghost">Logout</button></form>
        <form action={logoutAll}><button type="submit" className="pbtn pbtn-ghost">Sab Devices se Logout</button></form>
        <a className="pbtn pbtn-ghost" href="/api/account/export" download>⬇️ Mera Data Download</a>
      </div>

      <details className="pd-edit pd-danger"><summary>⚠️ Account hamesha ke liye hatao</summary>
        <p className="pd-warn">Ye wapas nahi hoga. Tumhara Profile, Photo, Tasks, Test Results, Goals, Bookmarks aur Reports sab hat jayenge.</p>
        {!confirmDel ? (
          <button type="button" className="pbtn pbtn-ghost" onClick={() => setConfirmDel(true)}>Main samajh gaya, aage badho</button>
        ) : (
          <form action={delAct} className="pd-form" noValidate>
            <F label="Confirm ke liye DELETE likho (bade akshar)" name="confirm" err={del.fieldErrors?.confirm} />
            <F label="Apna password" name="password" type="password" err={del.fieldErrors?.password} auto="current-password" />
            <button type="submit" className="pbtn pbtn-gold" disabled={delPend}>{delPend ? "Hat raha hai…" : "Account delete karo"}</button><Msg st={del} />
          </form>
        )}
      </details>
      <p className="pd-dim">Privacy: tumhara data sirf tumhe dikhta hai (doosre Users ko nahi). Alag se Privacy toggles abhi nahi hain, kyunki website mein koi public profile ya leaderboard nahi hai.</p>
    </section>
  );
}

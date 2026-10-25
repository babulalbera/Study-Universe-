"use client";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { login, resendConfirmation, signup } from "./actions";
import type { FormState } from "./types";

const P = {
  mail: "M3 6.5h18v11H3z M3.5 7l8.5 6.5L20.5 7",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8z M4.5 20a7.5 7.5 0 0115 0",
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 017 0v3",
  eye: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z M12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  eyeOff: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z M12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M4 4l16 16",
  arrow: "M5 12h14 M13 6l6 6-6 6",
};

function Ico({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
}

const LEVELS = ["", "Kamzor", "Theek-thak", "Accha", "Mazboot"];
function strength(v: string) {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return Math.max(1, s);
}

type FieldProps = {
  id: string; label: string; name: string; type?: string; placeholder?: string; autoComplete?: string;
  error?: string; icon: string;
};

function Field({ id, label, name, type = "text", placeholder, autoComplete, error, icon }: FieldProps) {
  const email = type === "email";
  return (
    <div className="au-f">
      <div className="au-lbl"><label htmlFor={id}>{label}</label></div>
      <div className="au-in">
        <Ico d={icon} />
        <input id={id} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete}
          inputMode={email ? "email" : undefined} autoCapitalize={email ? "none" : undefined} spellCheck={email ? false : undefined}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} required />
      </div>
      {error && <em id={`${id}-err`} role="alert" className="au-err">{error}</em>}
    </div>
  );
}

function PassField({ label, autoComplete, error, aside, meter }: { label: string; autoComplete: string; error?: string; aside?: ReactNode; meter?: boolean }) {
  const [show, setShow] = useState(false);
  const [val, setVal] = useState("");
  const s = meter ? strength(val) : 0;
  return (
    <div className="au-f">
      <div className="au-lbl"><label htmlFor="au-password">{label}</label>{aside}</div>
      <div className="au-in">
        <Ico d={P.lock} />
        <input id="au-password" name="password" type={show ? "text" : "password"} placeholder="••••••••" autoComplete={autoComplete}
          onInput={(e) => setVal(e.currentTarget.value)}
          aria-invalid={!!error} aria-describedby={error ? "au-password-err" : undefined} required />
        <button type="button" className="au-eye" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Password chhupao" : "Password dikhao"}>
          <Ico d={show ? P.eyeOff : P.eye} />
        </button>
      </div>
      {meter && s > 0 && (
        <div aria-live="polite">
          <div className="au-meter" data-s={s}><i /><i /><i /><i /></div>
          <small className="au-hint">Password: {LEVELS[s]}</small>
        </div>
      )}
      {error && <em id="au-password-err" role="alert" className="au-err">{error}</em>}
    </div>
  );
}

export default function AuthForm({ mode, next = "/profile" }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : signup, {});
  const fe = state.fieldErrors ?? {};
  const [rs, rsAction, rsPending] = useActionState<FormState, FormData>(resendConfirmation, {});
  const isLogin = mode === "login";
  return (
    <>
      <form action={action} className="au-form" noValidate>
        {isLogin && <input type="hidden" name="next" value={next} />}
        {!isLogin && <Field id="au-name" label="नाम" name="name" placeholder="आपका नाम" autoComplete="name" error={fe.name} icon={P.user} />}
        <Field id="au-email" label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" error={fe.email} icon={P.mail} />
        <PassField
          label={isLogin ? "Password" : "Password (कम से कम 8 अक्षर)"}
          autoComplete={isLogin ? "current-password" : "new-password"}
          error={fe.password}
          meter={!isLogin}
          aside={isLogin ? <Link href="/forgot-password">भूल गए?</Link> : undefined}
        />
        <button type="submit" className="au-btn" disabled={pending} aria-busy={pending}>
          {pending ? <><span className="au-spinner" aria-hidden="true" />रुको…</> : <>{isLogin ? "Login" : "Account बनाओ"}<Ico d={P.arrow} /></>}
        </button>
        {state.error && <p role="alert" className="au-msg au-msg-err">{state.error}</p>}
        {state.message && <p role="status" className="au-msg au-msg-ok">{state.message}</p>}
      </form>

      {isLogin && state.needsConfirm && (
        <form action={rsAction} className="au-form" style={{ marginTop: 14 }}>
          <input type="hidden" name="email" id="rs-email" />
          <button type="submit" className="au-ghost" disabled={rsPending}
            onClick={(e) => { const el = e.currentTarget.form?.elements.namedItem("email") as HTMLInputElement | null; const src = document.querySelector<HTMLInputElement>('input[name="email"][type="email"]'); if (el && src) el.value = src.value; }}>
            {rsPending ? "रुको…" : "Confirm Email dobara bhejo"}
          </button>
          {rs.error && <p role="alert" className="au-msg au-msg-err">{rs.error}</p>}
          {rs.fieldErrors?.email && <p role="alert" className="au-msg au-msg-err">{rs.fieldErrors.email}</p>}
          {rs.message && <p role="status" className="au-msg au-msg-ok">{rs.message}</p>}
        </form>
      )}
    </>
  );
}

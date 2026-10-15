"use client";
import { useActionState } from "react";
import Input from "@/components/ui/Input";
import { login, resendConfirmation, signup } from "./actions";
import type { FormState } from "./types";

export default function AuthForm({ mode, next = "/profile" }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : signup, {});
  const fe = state.fieldErrors ?? {};
  const [rs, rsAction, rsPending] = useActionState<FormState, FormData>(resendConfirmation, {});
  return (
    <>
    <form action={action} className="grid gap-4" noValidate>
      {mode === "login" && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && <Input label="नाम" name="name" type="text" placeholder="आपका नाम" autoComplete="name" error={fe.name} required />}
      <Input label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" error={fe.email} required />
      <Input label={mode === "signup" ? "Password (कम से कम 8 अक्षर)" : "Password"} name="password" type="password" placeholder="••••••••"
        autoComplete={mode === "signup" ? "new-password" : "current-password"} error={fe.password} required />
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>
        {pending ? "रुको…" : mode === "login" ? "Login" : "Account बनाओ"}
      </button>
      {state.error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{state.error}</p>}
      {state.message && <p role="status" className="text-[13px]" style={{ color: "#a7f3d0" }}>{state.message}</p>}
    </form>
    {mode === "login" && state.needsConfirm && (
      <form action={rsAction} className="grid gap-2" style={{ marginTop: 12 }}>
        <input type="hidden" name="email" id="rs-email" />
        <button type="submit" className="pbtn pbtn-ghost" disabled={rsPending}
          onClick={(e) => { const el = e.currentTarget.form?.elements.namedItem("email") as HTMLInputElement | null; const src = document.querySelector<HTMLInputElement>('input[name="email"][type="email"]'); if (el && src) el.value = src.value; }}>
          {rsPending ? "रुको…" : "Confirm Email dobara bhejo"}
        </button>
        {rs.error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{rs.error}</p>}
        {rs.fieldErrors?.email && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{rs.fieldErrors.email}</p>}
        {rs.message && <p role="status" className="text-[13px]" style={{ color: "#a7f3d0" }}>{rs.message}</p>}
      </form>
    )}
    </>
  );
}

"use client";
import { useActionState } from "react";
import Input from "@/components/ui/Input";
import { forgotPassword, setNewPassword } from "./actions";
import type { FormState } from "./types";

function Msg({ st }: { st: FormState }) {
  return (
    <>
      {st.error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{st.error}</p>}
      {st.message && <p role="status" className="text-[13px]" style={{ color: "var(--mint, #a7f3d0)" }}>{st.message}</p>}
    </>
  );
}

export function ForgotForm() {
  const [st, action, pending] = useActionState<FormState, FormData>(forgotPassword, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Input label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" error={st.fieldErrors?.email} required />
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "रुको…" : "Reset Link भेजो"}</button>
      <Msg st={st} />
    </form>
  );
}

export function ResetForm() {
  const [st, action, pending] = useActionState<FormState, FormData>(setNewPassword, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Input label="Naya password (kam se kam 8 akshar)" name="next" type="password" autoComplete="new-password" error={st.fieldErrors?.next} required />
      <Input label="Naya password dobara" name="again" type="password" autoComplete="new-password" error={st.fieldErrors?.again} required />
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "रुको…" : "Password badlo"}</button>
      <Msg st={st} />
    </form>
  );
}

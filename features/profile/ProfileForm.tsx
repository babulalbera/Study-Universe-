"use client";
import { useActionState } from "react";
import Input from "@/components/ui/Input";
import { updateProfile } from "./actions";
import type { FormState } from "./types";

export default function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Input label="नाम" name="name" defaultValue={name} error={state.fieldErrors?.name} required />
      <button type="submit" className="pbtn pbtn-gold" disabled={pending}>{pending ? "Save हो रहा है…" : "Save करो"}</button>
      {state.error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{state.error}</p>}
      {state.message && <p role="status" className="text-[13px]" style={{ color: "#a7f3d0" }}>{state.message}</p>}
    </form>
  );
}

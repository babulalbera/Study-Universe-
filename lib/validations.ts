export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(v: { email: string; password: string }) {
  const e: FieldErrors<"email" | "password"> = {};
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Sahi email likho";
  if (v.password.length < 8) e.password = "Password kam se kam 8 akshar ka ho";
  return e;
}

export function validateSignup(v: { name: string; email: string; password: string }) {
  const e: FieldErrors<"name" | "email" | "password"> = {};
  if (v.name.trim().length < 2) e.name = "Naam kam se kam 2 akshar ka ho";
  Object.assign(e, validateLogin(v));
  return e;
}

export function validateContact(v: { name: string; message: string }) {
  const e: FieldErrors<"name" | "message"> = {};
  if (v.name.trim().length < 2) e.name = "Naam likho";
  if (v.message.trim().length < 10) e.message = "Message kam se kam 10 akshar ka ho";
  return e;
}

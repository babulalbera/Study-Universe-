import type { InputHTMLAttributes } from "react";

type Props = { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>;

export default function Input({ label, error, id, ...rest }: Props) {
  const fid = id ?? rest.name;
  return (
    <label className="su-field" htmlFor={fid}>
      <span>{label}</span>
      <input id={fid} aria-invalid={!!error} {...rest} />
      {error && <em role="alert">{error}</em>}
    </label>
  );
}

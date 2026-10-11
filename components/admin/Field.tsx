type Props = {
  label: string; name: string; defaultValue?: string | number; type?: string; required?: boolean;
  placeholder?: string; rows?: number; options?: { value: string; label: string }[];
};

// Admin forms ka ek hi input-block (server component)
export default function Field({ label, name, defaultValue, type = "text", required, placeholder, rows, options }: Props) {
  return (
    <label className="su-field">
      <span>{label}</span>
      {options ? (
        <select name={name} defaultValue={String(defaultValue ?? "")}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : rows ? (
        <textarea name={name} rows={rows} defaultValue={defaultValue} required={required} placeholder={placeholder} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} />
      )}
    </label>
  );
}

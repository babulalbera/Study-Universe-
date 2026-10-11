export default function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className="glass text-[13.5px]" style={{ color: error ? "#fca5a5" : "#a7f3d0" }}>
      {error ?? ok}
    </p>
  );
}

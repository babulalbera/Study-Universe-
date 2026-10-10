export default function Loading({ label = "Load ho raha hai…" }: { label?: string }) {
  return (
    <div className="su-loading" role="status" aria-live="polite">
      <span className="su-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

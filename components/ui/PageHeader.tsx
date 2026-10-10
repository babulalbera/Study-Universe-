export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section>
      <div className="sec">
        <h2>{title}</h2>
        <i />
      </div>
      {subtitle ? (
        <p className="-mt-2 text-[13px] text-[color:var(--mute)]" style={{ fontFamily: "var(--dev)" }}>
          {subtitle}
        </p>
      ) : null}
    </section>
  );
}

import Link from "next/link";

export default function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className="sec" style={{ marginBottom: 4 }}>
          <h2>{title}</h2>
        </div>
        {subtitle ? (
          <p className="text-[13px] text-[color:var(--mute)]" style={{ fontFamily: "var(--dev)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <Link href="/" className="pbtn pbtn-ghost">
        ← Site देखें
      </Link>
    </div>
  );
}

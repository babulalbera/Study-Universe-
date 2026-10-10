import type { ReactNode } from "react";

type Props = { icon?: string; title: string; text?: string; action?: ReactNode };

export default function EmptyState({ icon = "📭", title, text, action }: Props) {
  return (
    <div className="glass su-empty">
      <div className="su-empty-ico" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

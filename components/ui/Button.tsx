import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "primary" | "ghost";
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export default function Button({ variant = "primary", href, children, className, ...rest }: Props) {
  const cls = cn("su-btn", variant === "primary" ? "su-btn-primary" : "su-btn-ghost", className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}

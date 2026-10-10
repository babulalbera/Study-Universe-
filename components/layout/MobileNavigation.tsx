"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav";

export default function MobileNavigation() {
  const path = usePathname();
  return (
    <nav className="su-bottom" aria-label="Mobile navigation">
      {NAV_ITEMS.map((n) => (
        <Link key={n.href} href={n.href} className={cn(isActive(path, n.href) && "on")}>
          <span aria-hidden="true">{n.icon}</span>
          <small>{n.label}</small>
        </Link>
      ))}
    </nav>
  );
}

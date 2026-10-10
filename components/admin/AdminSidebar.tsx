"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_LINKS } from "./links";


export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="admnav" aria-label="Admin मेनू">
      {ADMIN_LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

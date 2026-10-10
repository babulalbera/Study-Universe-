"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/profile", label: "👤 Profile" },
  { href: "/results", label: "📊 Results & Progress" },
  { href: "/tasks", label: "✅ Tasks" },
];

/** Profile और Results जैसे निजी Pages का साइड मेनू */
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="admnav" aria-label="मेरा खाता">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={pathname === i.href ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

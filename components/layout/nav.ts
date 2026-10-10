export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/books", label: "Books", icon: "📚" },
  { href: "/mock-tests", label: "Tests", icon: "📝" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

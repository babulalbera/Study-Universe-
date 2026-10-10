import Link from "next/link";

export default function Footer() {
  return (
    <footer className="su-footer">
      <span>Study Universe • Learn • Grow • Achieve</span>
      <nav aria-label="Footer">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}

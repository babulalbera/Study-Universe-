import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// Login / Signup ka premium frame: Krishna badge, heading, tabs, glow card, trust line.
// Server component hai — koi JS nahi.
export default function AuthShell({ mode, notice, children }: { mode: "login" | "signup"; notice?: ReactNode; children: ReactNode }) {
  const isLogin = mode === "login";
  return (
    <div className="au-shell">
      <header className="au-head">
        <div className="au-badge">
          <Image src="/images/status-krishna.webp" alt="" width={70} height={70} priority />
        </div>
        <h1 className="au-h">{isLogin ? <>Wapas <em>swagat</em> hai</> : <>Naya <em>safar</em> shuru karo</>}</h1>
        <p className="au-sub">{isLogin ? "अपने Account में जाओ, Streak जारी रखो।" : "Free Account बनाओ — बस 1 मिनट लगेगा।"}</p>
      </header>

      <nav className="au-tabs" aria-label="Login ya Signup">
        <Link href="/login" aria-current={isLogin ? "page" : undefined}>Login</Link>
        <Link href="/signup" aria-current={!isLogin ? "page" : undefined}>Signup</Link>
      </nav>

      <section className="au-card">
        {notice}
        {children}
      </section>

      <p className="au-foot">
        {isLogin ? <>नया हो? <Link href="/signup">Signup करो</Link></> : <>पहले से Account है? <Link href="/login">Login करो</Link></>}
      </p>
      <ul className="au-trust" aria-label="Bharosa">
        <li>🔒 Safe login</li>
        <li>✦ 100% Free</li>
        <li>🚫 No spam</li>
      </ul>
    </div>
  );
}

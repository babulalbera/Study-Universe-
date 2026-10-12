import type { Metadata } from "next";
import Link from "next/link";
import ProfileForm from "@/features/profile/ProfileForm";
import ProfileProgress from "@/features/profile/ProfileProgress";
import CommunityButtons from "@/features/profile/CommunityButtons";
import { getCurrentProfile } from "@/features/profile/queries";
import { logout } from "@/features/profile/actions";
import { getHomeSocials } from "@/features/home/queries";

export const metadata: Metadata = { title: "मेरी Profile" };

// Aage naye Features jodne ke liye: neeche "Quick Access" ki list mein ek line badhao, ya naya <section className="pf-card"> lagao.
const QUICK = [
  { href: "/tasks", icon: "✅", label: "Daily Tasks", plain: true },
  { href: "/books", icon: "📚", label: "Books & PDFs" },
  { href: "/mock-tests", icon: "📝", label: "Mock Tests" },
  { href: "/results", icon: "📊", label: "Results" },
];

export default async function ProfilePage() {
  const [me, socials] = await Promise.all([getCurrentProfile(), getHomeSocials()]);
  const name = me?.name || me?.email.split("@")[0] || "Guest";
  const sub = me ? `${me.role === "admin" ? "Admin" : "Member"} • Jai Shri Krishna` : "Guest • Login karo, progress save rahegi";

  return (
    <div className="pf">
      <section className="pf-card pf-hero">
        <div className="pf-av" aria-hidden="true">{name.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <h1 className="pf-name">{name}</h1>
          <p className="pf-sub">{sub}</p>
          {me?.email && <p className="pf-mail">{me.email}</p>}
        </div>
      </section>

      {!me && (
        <section className="pf-card">
          <h2 className="pf-h">Account</h2>
          <p className="su-muted">Login करने पर तुम्हारे Tasks, Streak और Results हर फोन में मिलेंगे।</p>
          <div className="su-row"><Link className="pbtn pbtn-gold" href="/login?next=/profile">Login</Link><Link className="pbtn pbtn-ghost" href="/signup">Signup</Link></div>
        </section>
      )}

      <ProfileProgress loggedIn={Boolean(me)} />

      <section className="pf-card">
        <h2 className="pf-h">Quick Access</h2>
        <div className="pf-grid">
          {QUICK.map((q) => (q.plain
            ? <a key={q.href} className="pf-tile" href={q.href}><span aria-hidden="true">{q.icon}</span>{q.label}</a>
            : <Link key={q.href} className="pf-tile" href={q.href}><span aria-hidden="true">{q.icon}</span>{q.label}</Link>))}
          {me?.role === "admin" && <Link className="pf-tile" href="/admin"><span aria-hidden="true">🛠</span>Admin Panel</Link>}
        </div>
      </section>

      {me && (
        <section className="pf-card">
          <h2 className="pf-h">Account Settings</h2>
          <ProfileForm name={me.name} />
          <form action={logout} style={{ marginTop: 12 }}><button type="submit" className="pbtn pbtn-ghost">Logout</button></form>
        </section>
      )}

      <section className="pf-card">
        <h2 className="pf-h">Join Community</h2>
        <CommunityButtons socials={socials.map((s) => ({ key: s.key, name: s.name, href: s.href }))} />
      </section>
    </div>
  );
}

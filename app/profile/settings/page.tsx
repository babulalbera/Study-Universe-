import type { Metadata } from "next";
import Link from "next/link";
import ProfileEditor from "@/features/profile/dashboard/ProfileEditor";
import AccountSection from "@/features/profile/dashboard/AccountSection";
import SupportSection from "@/features/profile/dashboard/SupportSection";
import { Icon } from "@/features/profile/dashboard/icons";
import { getFullProfile } from "@/features/profile/dashboard/queries";

export const metadata: Metadata = { title: "Settings" };

// Saari zaroori settings ek jagah: Profile Edit, Account & Security, Help. (Naya section: neeche ek <details> aur jodo.)
export default async function SettingsPage() {
  const p = await getFullProfile();
  return (
    <div className="pd">
      <div className="ov-head" style={{ marginBottom: 0 }}>
        <Link href="/profile" className="ov-more" aria-label="Profile par wapas">← Profile</Link>
        <h1 className="pd-h" style={{ margin: 0, fontSize: 20 }}>⚙️ Settings</h1>
        <span style={{ width: 70 }} aria-hidden="true" />
      </div>
      {p ? (
        <>
          <details className="ov-sec set-acc" open>
            <summary><span className="ov-ic ov-ic-sm"><Icon name="user" /></span><span className="ov-ttx"><b>Profile Edit</b><small>Photo, naam, mobile, lakshya, goal</small></span><span className="set-chev"><Icon name="chevron" size={18} /></span></summary>
            <ProfileEditor p={p} />
          </details>
          <details className="ov-sec set-acc">
            <summary><span className="ov-ic ov-ic-sm"><Icon name="shield" /></span><span className="ov-ttx"><b>Account & Security</b><small>Password, email, logout, data, delete</small></span><span className="set-chev"><Icon name="chevron" size={18} /></span></summary>
            <AccountSection p={p} />
          </details>
          <details className="ov-sec set-acc">
            <summary><span className="ov-ic ov-ic-sm"><Icon name="help" /></span><span className="ov-ttx"><b>Help & Support</b><small>FAQ, problem report, policies</small></span><span className="set-chev"><Icon name="chevron" size={18} /></span></summary>
            <SupportSection />
          </details>
        </>
      ) : (
        <section className="ov-sec">
          <p className="pd-dim">Settings dekhne ke liye Login karo.</p>
          <div className="pd-row"><Link className="pbtn pbtn-gold" href="/login?next=/profile/settings">Login</Link></div>
        </section>
      )}
    </div>
  );
}

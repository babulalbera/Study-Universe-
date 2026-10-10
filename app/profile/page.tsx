import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Sidebar from "@/components/layout/Sidebar";
import ProfileForm from "@/features/profile/ProfileForm";
import { getCurrentProfile } from "@/features/profile/queries";
import { logout } from "@/features/profile/actions";

export const metadata: Metadata = { title: "मेरी Profile" };

export default async function ProfilePage() {
  const me = await getCurrentProfile();
  return (
    <>
      <PageHeader title="👤 मेरी Profile" subtitle="नाम और Account की जानकारी।" />
      <div className="adm" style={{ marginTop: 0 }}>
        <Sidebar />
        {!me ? (
          <EmptyState icon="🔐" title="Profile देखने के लिए Login करें" text="Login करने के बाद यहाँ आपकी जानकारी दिखेगी."
            action={<><Button href="/login">Login</Button><Button href="/signup" variant="ghost">Signup</Button></>} />
        ) : (
          <section className="glass grid gap-4 content-start">
            <p className="text-[13px] text-[color:var(--mute)]">Email: <b className="text-white">{me.email}</b> • Role: <b className="text-[color:var(--gold2)]">{me.role}</b></p>
            <ProfileForm name={me.name} />
            <form action={logout}><button type="submit" className="pbtn pbtn-ghost">Logout</button></form>
          </section>
        )}
      </div>
    </>
  );
}

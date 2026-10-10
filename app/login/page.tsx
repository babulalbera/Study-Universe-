import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import AuthForm from "@/features/profile/AuthForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <PageHeader title="🔑 Login" subtitle="अपने Account में जाओ।" />
      <section className="glass max-w-md w-full self-center">
        {error === "confirm" && (
          <p role="alert" className="mb-3 text-[13px]" style={{ color: "#fca5a5" }}>Email confirm नहीं हो पाया। Link पुराना हो सकता है, दोबारा Signup/Login करो।</p>
        )}
        <AuthForm mode="login" next={next} />
        <p className="mt-4 text-[13px] text-[color:var(--mute)]" style={{ fontFamily: "var(--dev)" }}>
          नया हो? <Link href="/signup" className="text-[color:var(--gold2)] font-semibold">Signup करो</Link>
        </p>
      </section>
    </>
  );
}

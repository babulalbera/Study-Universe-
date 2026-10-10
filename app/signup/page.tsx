import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import AuthForm from "@/features/profile/AuthForm";

export const metadata: Metadata = { title: "Signup" };

export default function SignupPage() {
  return (
    <>
      <PageHeader title="✨ Signup" subtitle="Free Account बनाओ।" />
      <section className="glass max-w-md w-full self-center">
        <AuthForm mode="signup" />
        <p className="mt-4 text-[13px] text-[color:var(--mute)]" style={{ fontFamily: "var(--dev)" }}>
          पहले से Account है? <Link href="/login" className="text-[color:var(--gold2)] font-semibold">Login करो</Link>
        </p>
      </section>
    </>
  );
}

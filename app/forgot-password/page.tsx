import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { ForgotForm } from "@/features/profile/ResetForms";

export const metadata: Metadata = { title: "Password bhool gaye" };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHeader title="🔑 Password भूल गए?" subtitle="Email डालो, Reset Link आएगा।" />
      <section className="glass max-w-md w-full self-center">
        <ForgotForm />
        <p className="mt-4 text-[13px] text-[color:var(--mute)]">
          Email नहीं आता? Spam folder देखो। <Link href="/login" className="text-[color:var(--gold2)] font-semibold">Login पर वापस</Link>
        </p>
      </section>
    </>
  );
}

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
          <p role="alert" className="mb-3 text-[13px]" style={{ color: "#fca5a5" }}>Link खोलने में दिक्कत आई। अगर Email का Link दबाया था तो Email शायद confirm हो चुका है, अब सीधे Login करके देखो। न चले तो Login की कोशिश करने पर Confirm Email दोबारा भेजो बटन दिखेगा।</p>
        )}
        {error === "expired" && (
          <p role="alert" className="mb-3 text-[13px]" style={{ color: "#fca5a5" }}>Email का Link पुराना हो गया है। नया Link मँगाओ (Login करके या Password भूल गए पर)।</p>
        )}
        <AuthForm mode="login" next={next} />
        <p className="mt-3 text-[13px]"><Link href="/forgot-password" className="text-[color:var(--gold2)] font-semibold">Password भूल गए?</Link></p>
        <p className="mt-4 text-[13px] text-[color:var(--mute)]" style={{ fontFamily: "var(--dev)" }}>
          नया हो? <Link href="/signup" className="text-[color:var(--gold2)] font-semibold">Signup करो</Link>
        </p>
      </section>
    </>
  );
}

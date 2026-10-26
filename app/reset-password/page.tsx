import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { ResetForm } from "@/features/profile/ResetForms";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Naya password" };

export default async function ResetPasswordPage() {
  const user = await getUser(); // Reset code sahi daalne par session apne aap ban jata hai
  return (
    <>
      <PageHeader title="🔐 नया Password" subtitle="अपना नया Password रखो।" />
      <section className="glass max-w-md w-full self-center">
        {user ? <ResetForm /> : (
          <p className="text-[13px]" style={{ color: "#fca5a5" }}>
            Reset code पुराना या गलत है। <Link href="/forgot-password" className="text-[color:var(--gold2)] font-semibold">नया Reset code मँगाओ</Link>
          </p>
        )}
      </section>
    </>
  );
}

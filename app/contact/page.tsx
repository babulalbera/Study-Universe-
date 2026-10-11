import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { getSiteSettings } from "@/features/home/queries";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const email = settings.contact_email || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <>
      <PageHeader title="✉️ संपर्क करें" subtitle="कोई सवाल, सुझाव या शिकायत हो तो बताइए।" />
      <section className="glass prose-hi">
        {email ? (
          <>
            <p>हमें Email करें:</p>
            <div className="mt-4">
              <Button href={`mailto:${email}`}>{email}</Button>
            </div>
          </>
        ) : (
          <p>
            Contact Email अभी set नहीं है। (Owner: <code>.env.local</code> में <code>NEXT_PUBLIC_CONTACT_EMAIL</code> भरें।) तब तक Home Page के Community Links से जुड़ें।
          </p>
        )}
        <div className="mt-4">
          <Button href="/" variant="ghost">← Home</Button>
        </div>
      </section>
    </>
  );
}

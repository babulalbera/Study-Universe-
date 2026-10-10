import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="📜 Terms & Conditions" subtitle="Site इस्तेमाल करने के नियम।" />
      <section className="glass prose-hi">
        <h3>उपयोग</h3>
        <p>Study Universe पढ़ाई के लिए है। Site का दुरुपयोग, Hacking या दूसरों के Account में घुसने की कोशिश मना है।</p>
        <h3>Content</h3>
        <p>यहाँ के Notes, PDFs और Tests केवल आपके निजी अध्ययन के लिए हैं। बिना अनुमति इन्हें बेचना या दोबारा बाँटना मना है।</p>
        <h3>Mock Tests</h3>
        <p>Mock Test का Score केवल अभ्यास के लिए है। असली परीक्षा के परिणाम की कोई गारंटी नहीं है।</p>
        <h3>बदलाव</h3>
        <p>हम ये नियम समय-समय पर बदल सकते हैं। Site इस्तेमाल करते रहना नए नियम मानना माना जाएगा।</p>
        <p className="text-[12px] text-[color:var(--mute)]">
          नोट: Site चालू करने से पहले इन्हें अपनी असली ज़रूरत के अनुसार जाँच/बदल लें।
        </p>
      </section>
    </>
  );
}

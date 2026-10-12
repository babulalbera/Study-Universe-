import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { getSiteSettings } from "@/features/home/queries";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const { contact_email: email } = await getSiteSettings();
  return (
    <>
      <PageHeader title="ℹ️ Study Universe के बारे में" />

      <section className="glass about prose-hi">
        <p>
          <em>Study Universe</em> एक Free पढ़ाई का मंच है – SSC CGL जैसी परीक्षाओं की तैयारी के लिए Daily Tasks, Books, Notes, PDFs और Mock Tests एक ही जगह।
        </p>
        <p>
          हमारा मकसद सीधा है: <em>Learn • Grow • Achieve</em>। हर दिन थोड़ा-थोड़ा Task पूरा करो, Test दो, अपनी Progress देखो और अगले दिन और बेहतर बनो।
        </p>
        <h3>यहाँ क्या मिलेगा</h3>
        <ul>
          <li>Daily Tasks और Streak Tracker</li>
          <li>Category के हिसाब से Books और PDFs</li>
          <li>असली Exam Pattern वाले Mock Tests</li>
          <li>Result और Progress का हिसाब</li>
        </ul>
      </section>

      <section className="glass about prose-hi about-note" aria-labelledby="disclaimer">
        <h3 id="disclaimer" style={{ marginTop: 0 }}>📢 ज़रूरी सूचना (Disclaimer)</h3>
        <p>
          इस Website पर मौजूद Books, PDFs, Notes, Courses और बाकी Study Material <em>हमारा बनाया हुआ नहीं है</em>। यह सामग्री अलग-अलग जगहों से ली गई है। इसके असली मालिकों या बनाने वालों से हमारा <em>कोई संबंध नहीं है</em>।
        </p>

        <h3>किसी को आपत्ति या नुकसान हो तो</h3>
        <p>
          अगर किसी को लगता है कि यहाँ मौजूद उनकी सामग्री से उन्हें आपत्ति है या उन्हें नुकसान हो रहा है, तो वे हमसे संपर्क करके अपनी सामग्री हटाने के लिए कह सकते हैं। हम उसे हटा देंगे।
        </p>
        <p>
          संपर्क करते समय बताइए कि कौन-सी सामग्री है (नाम या Page का Link) और आप उसके मालिक हैं।{" "}
          {email ? <>Email: <a href={`mailto:${email}`} style={{ color: "var(--gold2)", fontWeight: 700 }}>{email}</a> या </> : null}
          <Link href="/contact" style={{ color: "var(--gold2)", fontWeight: 700 }}>Contact Page</Link> से लिखिए।
        </p>

        <h3>यह Website किसके लिए है</h3>
        <p>
          हम इस Website से कोई कमाई नहीं करते। यह सिर्फ़ उन गरीब Students के लिए है जो Batch, Books या Courses का खर्च नहीं उठा पा रहे हैं।
        </p>
      </section>
    </>
  );
}

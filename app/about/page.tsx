import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
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
    </>
  );
}

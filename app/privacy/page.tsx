import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="🔒 Privacy Policy" subtitle="हम आपका डेटा कैसे संभालते हैं।" />
      <section className="glass prose-hi">
        <h3>हम कौन-सी जानकारी लेते हैं</h3>
        <ul>
          <li>Account बनाते समय: नाम और Email।</li>
          <li>Site इस्तेमाल करते समय: पूरे किए Tasks, Test के उत्तर, Score और Bookmarks।</li>
        </ul>
        <h3>जानकारी का उपयोग</h3>
        <p>केवल आपका Account चलाने, Progress दिखाने और Site बेहतर बनाने के लिए। हम आपका डेटा बेचते नहीं हैं।</p>
        <h3>सुरक्षा</h3>
        <p>आपका निजी डेटा दूसरे Users को नहीं दिखता। Password हमारे पास सादे रूप में नहीं रखा जाता।</p>
        <h3>आपके अधिकार</h3>
        <p>आप अपना डेटा देख सकते हैं और Account हटाने का अनुरोध कर सकते हैं। इसके लिए Contact Page से संपर्क करें।</p>
        <p className="text-[12px] text-[color:var(--mute)]">
          नोट: Site चालू करने से पहले इस Policy को अपनी असली स्थिति के अनुसार जाँच/बदल लें।
        </p>
      </section>
    </>
  );
}

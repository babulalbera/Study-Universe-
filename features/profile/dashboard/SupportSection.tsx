import Link from "next/link";
import ReportForm from "./ReportForm";

const FAQ: [string, string][] = [
  ["Mera Task ya Streak save nahi ho raha?", "Login karke Tasks complete karo. Bina Login ke Task sirf usi phone mein rehte hain. Streak ke liye roz kam se kam 1 Task complete karna zaroori hai."],
  ["Cover Photo dusre phone mein kyun nahi dikhti?", "Task ki Cover Photo sirf usi phone ki local storage mein rehti hai (server par nahi jati), isliye dusre phone mein nahi dikhti."],
  ["Mock Test beech mein chhod diya to?", "Test ka Timer band nahi hota. Wapas aane par bacha hua samay hi milega, aur samay khatam hone par Test apne aap submit hota hai."],
  ["PDF nahi khul rahi?", "PDF kholne ke liye Login zaroori hai. Phir bhi na khule to neeche Report karo."],
  ["Mera Account ya Data kaise hataun?", "Account Settings mein 'Account hamesha ke liye hatao' se Account aur uska data hat jata hai. Data ki copy 'Mera Data Download' se milti hai."],
];

export default function SupportSection() {
  return (
    <section id="help" className="pd-card">
      <h2 className="pd-h">🛟 Help aur Support</h2>
      <h3 className="pd-h3">Aksar puche jaane wale sawal</h3>
      {FAQ.map(([q, a]) => (<details key={q} className="pd-faq"><summary>{q}</summary><p>{a}</p></details>))}
      <h3 className="pd-h3">Samasya batao (Report a Problem)</h3>
      <ReportForm />
      <h3 className="pd-h3">Jaankari</h3>
      <div className="pd-row">
        <Link className="pbtn pbtn-ghost" href="/about">About</Link><Link className="pbtn pbtn-ghost" href="/contact">Contact</Link>
        <Link className="pbtn pbtn-ghost" href="/privacy">Privacy Policy</Link><Link className="pbtn pbtn-ghost" href="/terms">Terms</Link>
      </div>
    </section>
  );
}

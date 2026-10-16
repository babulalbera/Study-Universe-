import Link from "next/link";
import ReportForm from "./ReportForm";

export default function SupportSection() {
  return (
    <div className="pd-plain">
      <h3 className="pd-h3">Samasya batao (Report a Problem)</h3>
      <ReportForm />
      <h3 className="pd-h3">Jaankari</h3>
      <div className="pd-row">
        <Link className="pbtn pbtn-ghost" href="/about">About</Link><Link className="pbtn pbtn-ghost" href="/contact">Contact</Link>
        <Link className="pbtn pbtn-ghost" href="/privacy">Privacy Policy</Link><Link className="pbtn pbtn-ghost" href="/terms">Terms</Link>
      </div>
    </div>
  );
}

import Image from "next/image";
import type { DailyQuote } from "./redesign-queries";

// "Krishna Blessings" banner: roz ka ek shlok (database ke daily_quotes se)
export default function KrishnaBanner({ quote }: { quote: DailyQuote }) {
  return (
    <section className="pr-banner" aria-label="Krishna Blessings">
      <div className="pr-b-top">
        <Image className="pr-b-img" src="/images/status-krishna.webp" alt="" width={58} height={58} />
        <div className="pr-b-tx">
          <p className="pr-b-k">☘ KRISHNA BLESSINGS</p>
          <p className="pr-b-t">कान्हा तुम्हारे साथ है</p>
          <p className="pr-b-sub">Roz padho, roz ek kadam aage badho</p>
        </div>
        <span className="pr-heart" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" />
          </svg>
        </span>
      </div>
      <blockquote className="pr-b-q">
        <p className="pr-b-s">“{quote.shloka}”</p>
        {quote.meaning ? <p className="pr-b-m">{quote.meaning}</p> : null}
        {quote.source ? <small>{quote.source}</small> : null}
      </blockquote>
    </section>
  );
}

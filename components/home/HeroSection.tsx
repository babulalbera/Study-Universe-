import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="glass rv">
      <div className="hero">
        <div className="avatar">
          <Image src="/images/hero-krishna.webp" alt="Baby Krishna with peacock feather and flute" width={92} height={92} priority />
        </div>
        <div>
          <div className="k1">✦ KRISHNA BLESSINGS • PREMIUM EDIT</div>
          <div className="k2">कान्हा तुम्हारे साथ है • Straight 0°</div>
          <div className="k3">Har task complete = ashirwad +1</div>
        </div>
      </div>
      <div className="quote">
        <b>“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन”</b>
        <span>मेहनत तुम्हारी, सफलता निश्चित है</span>
        <small>हौसला मत हारो, कान्हा तुम्हारे साथ है!</small>
      </div>
    </section>
  );
}

import Image from "next/image";
import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import SocialLinks from "@/components/home/SocialLinks";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import HomeEffects from "@/components/home/HomeEffects";
import { DEFAULT_FEATURE_CARDS, DEFAULT_SOCIAL_LINKS } from "@/features/home/data";

export default function HomePage() {
  const cards = DEFAULT_FEATURE_CARDS;
  const socials = DEFAULT_SOCIAL_LINKS;
  return (
    <>
      <HomeEffects />
      <HeroSection />
      <AnnouncementBanner items={[]} />
      <section className="rv">
        <div className="sec"><h2>👑 Premium Study Tools</h2><i /></div>
        <div className="grid tools">
          {cards.map((c, i) => <FeatureCard key={c.key} card={c} index={i} />)}
        </div>
      </section>
      <SocialLinks links={socials} />
      <section className="glass status rv">
        <div className="avatar">
          <Image src="/images/status-krishna.webp" alt="" width={54} height={54} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="st1">
            <span>Best banao, roz jeeto</span><span>•</span>
            <span style={{ color: "#a7f3d0" }}>Premium Edit</span><span>•</span>
            <span style={{ color: "var(--gold2)" }}>Jai Shri Krishna</span>
          </div>
          <div className="st2">Premium dark • Gold+Emerald aura • Focus mode • Reset Din</div>
        </div>
      </section>
    </>
  );
}

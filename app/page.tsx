import Image from "next/image";
import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import SocialLinks from "@/components/home/SocialLinks";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import HomeEffects from "@/components/home/HomeEffects";
import { getActiveAnnouncements, getHomeCards, getHomeSocials } from "@/features/home/queries";

export const revalidate = 60; // Home 60 second mein ek baar taza hota hai

export default async function HomePage() {
  const [cards, socials, notices] = await Promise.all([getHomeCards(), getHomeSocials(), getActiveAnnouncements()]);
    return (
    <>
      <HomeEffects />
      <HeroSection />
      <AnnouncementBanner items={notices} />
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

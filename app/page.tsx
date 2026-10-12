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
      <AnnouncementBanner items={notices} />
      <section className="rv">
        <div className="sec"><h2>👑 Premium Study Tools</h2><i /></div>
        <div className="grid tools">
          {cards.map((c, i) => <FeatureCard key={c.key} card={c} index={i} />)}
        </div>
      </section>
      <SocialLinks links={socials} />
    </>
  );
}

import type { Metadata } from "next";
import FeatureCard from "@/components/home/FeatureCard";
import SocialLinks from "@/components/home/SocialLinks";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import LandingHero from "@/components/home/LandingHero";
import Marquee from "@/components/home/Marquee";
import HowItWorks from "@/components/home/HowItWorks";
import HomeEffects from "@/components/home/HomeEffects";
import JsonLd from "@/components/seo/JsonLd";
import { getActiveAnnouncements, getHomeCards, getHomeSocials } from "@/features/home/queries";
import { SITE } from "@/lib/site";

export const revalidate = 60; // Home 60 second mein ek baar taza hota hai

// Home ka apna pura title (template "| Study Universe" yahan nahi judta)
export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: "/" },
};

// Google ko batate hain ki ye kaun si website hai aur kiski hai
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "hi-IN",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/images/logo.webp`,
      description: SITE.description,
    },
  ],
};

export default async function HomePage() {
  const [cards, socials, notices] = await Promise.all([getHomeCards(), getHomeSocials(), getActiveAnnouncements()]);
  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeEffects />
      <LandingHero />
      <AnnouncementBanner items={notices} />
      <Marquee />
      <section className="rv">
        <div className="sec"><h2>Premium Study Tools</h2><i /></div>
        <div className="lg-grid tools">
          {cards.map((c, i) => <FeatureCard key={c.key} card={c} index={i} />)}
        </div>
      </section>
      <HowItWorks />
      <SocialLinks links={socials} />
    </>
  );
}

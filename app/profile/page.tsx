import type { Metadata } from "next";
import Link from "next/link";
import ProfileHeader from "@/features/profile/dashboard/ProfileHeader";
import StudyOverview from "@/features/profile/dashboard/StudyOverview";
import QuickAccess from "@/features/profile/dashboard/QuickAccess";
import LearningCards from "@/features/profile/dashboard/LearningCards";
import CommunityRow from "@/features/profile/dashboard/CommunityRow";
import TelegramReferralCard from "@/features/profile/dashboard/TelegramReferralCard";
import { getFullProfile, getStudyData, getTestsOverview } from "@/features/profile/dashboard/queries";
import { getProfileExtras } from "@/features/profile/dashboard/redesign-queries";
import { getReferralCount } from "@/features/profile/dashboard/referral-queries";
import { claimPendingReferral } from "@/features/profile/dashboard/referral-actions";
import { getFavorites } from "@/features/bookmarks/queries";
import ContinueLearning from "@/features/profile/dashboard/ContinueLearning";
import SettingsMore from "@/features/profile/dashboard/SettingsMore";
import { T } from "@/lib/i18n";
import { getContinueBook } from "@/features/profile/dashboard/continue-queries";
import { getHomeSocials, getSiteSettings } from "@/features/home/queries";
import "@/features/profile/dashboard/profile-redesign.css";

export const metadata: Metadata = { title: "Meri Profile" };

// Profile: Profile card (Points/Rank), Quick Access, Study Overview, Continue Learning, Settings & More,
// My Learning, Telegram+Referral, Community.
// Sab kuch ek bhasha (English / हिन्दी) me, jo user ne Settings & More > Language me chuni hai.
export default async function ProfilePage() {
  const p = await getFullProfile();

  if (!p) {
    return (
      <div className="pd">
        <section className="ov-sec">
          <h1 className="pd-h" style={{ fontSize: 18 }}>👤 Meri Profile</h1>
          <p className="pd-dim">Login karne par yahan tumhari Profile, Study Overview aur Settings dikhengi.</p>
          <div className="pd-row">
            <Link className="pbtn pbtn-gold" href="/login?next=/profile">Login</Link>
            <Link className="pbtn pbtn-ghost" href="/signup">Signup</Link>
          </div>
        </section>
      </div>
    );
  }

  // Agar ye banda kisi referral link (/r/CODE) se aaya tha, to ek hi baar "credit" de do
  await claimPendingReferral();

  const [socials, settings, study, tests, extras, favs, cont, referralCount] = await Promise.all([
    getHomeSocials(), getSiteSettings(), getStudyData(p.id), getTestsOverview(), getProfileExtras(p.id), getFavorites(), getContinueBook(), getReferralCount(p.id),
  ]);
  const lang = extras.lang;
  const favCount = favs.books.length + favs.tests.length;

  return (
    <div className="pd" data-lang={lang}>
      <ProfileHeader p={p} bio={extras.bio} input={study} points={extras.pr.points} level={extras.pr.level} rank={extras.pr.rank} lang={lang} />
      <QuickAccess courseHref={settings.course_url || null} isAdmin={p.role === "admin"} favCount={favCount} bookCount={favs.books.length} lang={lang} />
      <StudyOverview input={study} mockCount={tests.submitted.length} lang={lang} />
      <ContinueLearning book={cont} lang={lang} />
      <SettingsMore lang={lang} favCount={favCount} notifyOn={extras.notifyOn} />
      <LearningCards input={study} lang={lang} />
      <TelegramReferralCard telegramLinked={p.telegramLinked} telegramUsername={p.telegramUsername} referralCode={p.referralCode} referralCount={referralCount} />
      <CommunityRow socials={socials.map((s) => ({ key: s.key, name: s.name, href: s.href, icon: s.icon }))} lang={lang} />
      <div className="pr-foot">
        <b>{T[lang].footer}</b>
        <small>{T[lang].footerSub}</small>
      </div>
    </div>
  );
}

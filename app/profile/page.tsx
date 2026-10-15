import type { Metadata } from "next";
import Link from "next/link";
import ProfileHeader from "@/features/profile/dashboard/ProfileHeader";
import StudyOverview from "@/features/profile/dashboard/StudyOverview";
import QuickAccess from "@/features/profile/dashboard/QuickAccess";
import LearningCards from "@/features/profile/dashboard/LearningCards";
import CommunityRow from "@/features/profile/dashboard/CommunityRow";
import StudySection from "@/features/profile/dashboard/StudySection";
import TestsSection from "@/features/profile/dashboard/TestsSection";
import AchievementsSection from "@/features/profile/dashboard/AchievementsSection";
import LearningSection from "@/features/profile/dashboard/LearningSection";
import NotificationsSection from "@/features/profile/dashboard/NotificationsSection";
import AccountSection from "@/features/profile/dashboard/AccountSection";
import SupportSection from "@/features/profile/dashboard/SupportSection";
import {
  getAccuracy, getFullProfile, getGoals, getLearning, getNotifications, getStudyData, getTestsOverview,
} from "@/features/profile/dashboard/queries";
import { getHomeSocials, getSiteSettings } from "@/features/home/queries";

export const metadata: Metadata = { title: "Meri Profile" };

const NAV = [
  ["#study", "Study"], ["#tests", "Tests"], ["#badges", "Badges"], ["#learning", "Padhai"],
  ["#alerts", "Alerts"], ["#account", "Account"], ["#help", "Help"],
] as const;

export default async function ProfilePage() {
  const p = await getFullProfile();

  if (!p) {
    return (
      <div className="pd">
        <section className="ov-sec">
          <h1 className="pd-h" style={{ fontSize: 18 }}>👤 Meri Profile</h1>
          <p className="pd-dim">Login karne par yahan tumhari Profile, Study Overview, Test Results, Badges aur Account Settings dikhengi.</p>
          <div className="pd-row">
            <Link className="pbtn pbtn-gold" href="/login?next=/profile">Login</Link>
            <Link className="pbtn pbtn-ghost" href="/signup">Signup</Link>
          </div>
        </section>
      </div>
    );
  }

  const [socials, settings, study, goals, tests, accuracy, learning, notifs] = await Promise.all([
    getHomeSocials(), getSiteSettings(), getStudyData(p.id), getGoals(), getTestsOverview(), getAccuracy(), getLearning(), getNotifications(p.prefs),
  ]);
  const attempts = tests.submitted.filter((a) => a.at).map((a) => ({ submitted_at: a.at, pct: a.pct }));

  return (
    <div className="pd">
      <ProfileHeader p={p} />
      <StudyOverview input={study} mockCount={tests.submitted.length} />
      <QuickAccess courseHref={settings.course_url || null} isAdmin={p.role === "admin"} />
      <LearningCards input={study} />
      <CommunityRow socials={socials.map((s) => ({ key: s.key, name: s.name, href: s.href, icon: s.icon }))} />

      <nav className="pd-nav" aria-label="Poori jaankari ke sections">
        <span className="pd-navt">Poori jaankari:</span>
        {NAV.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
      </nav>

      <StudySection input={study} goals={goals} dailyGoal={p.dailyGoal} examDate={p.examDate} targetExam={p.targetExam} />
      <TestsSection submitted={tests.submitted} open={tests.open} subjects={tests.subjects} accuracy={accuracy} />
      <AchievementsSection hist={study.hist} log={study.log} attempts={attempts} />
      <LearningSection saved={learning.saved} recent={learning.recent} open={tests.open} results={tests.submitted} />
      <NotificationsSection items={notifs} prefs={p.prefs} />
      <AccountSection p={p} />
      <SupportSection />
    </div>
  );
}

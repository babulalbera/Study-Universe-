import type { Metadata } from "next";
import Link from "next/link";
import ProfileHeader from "@/features/profile/dashboard/ProfileHeader";
import StudyOverview from "@/features/profile/dashboard/StudyOverview";
import QuickAccess from "@/features/profile/dashboard/QuickAccess";
import LearningCards from "@/features/profile/dashboard/LearningCards";
import CommunityRow from "@/features/profile/dashboard/CommunityRow";
import { getFullProfile, getStudyData, getTestsOverview } from "@/features/profile/dashboard/queries";
import { getHomeSocials, getSiteSettings } from "@/features/home/queries";

export const metadata: Metadata = { title: "Meri Profile" };

// Simple Profile: Profile card, Study Overview, Quick Access, My Learning, Community.
// Zaroori settings sab ⚙️ Settings icon (/profile/settings) ke andar hain.
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

  const [socials, settings, study, tests] = await Promise.all([getHomeSocials(), getSiteSettings(), getStudyData(p.id), getTestsOverview()]);

  return (
    <div className="pd">
      <ProfileHeader p={p} />
      <StudyOverview input={study} mockCount={tests.submitted.length} />
      <QuickAccess courseHref={settings.course_url || null} isAdmin={p.role === "admin"} />
      <LearningCards input={study} />
      <CommunityRow socials={socials.map((s) => ({ key: s.key, name: s.name, href: s.href, icon: s.icon }))} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import ProfileHeader from "@/features/profile/dashboard/ProfileHeader";
import StudyOverview from "@/features/profile/dashboard/StudyOverview";
import ProfileSettings from "@/features/profile/dashboard/ProfileSettings";
import { getFullProfile, getStudyData, getTestsOverview } from "@/features/profile/dashboard/queries";

export const metadata: Metadata = { title: "Meri Profile" };

export default async function ProfilePage() {
  const p = await getFullProfile();

  if (!p) {
    return <div className="pd"><section className="ov-sec" style={{ textAlign: "center", padding: 28 }}>
      <h1 className="pd-h" style={{ fontSize: 22 }}>👤 Meri Profile</h1>
      <p className="pd-dim">Apni profile dekhne ke liye login karein.</p>
      <div className="pd-row" style={{ justifyContent: "center" }}>
        <Link className="pbtn pbtn-gold" href="/login?next=/profile">Login</Link>
        <Link className="pbtn pbtn-ghost" href="/signup">Signup</Link>
      </div>
    </section></div>;
  }

  const [study, tests] = await Promise.all([getStudyData(p.id), getTestsOverview()]);

  return <div className="pd" style={{ position: "relative", maxWidth: 900, marginInline: "auto" }}>
    <ProfileSettings p={p} />
    <ProfileHeader p={p} />
    <StudyOverview input={study} mockCount={tests.submitted.length} />
    <section className="ov-sec" style={{ padding: 18 }}>
      <h2 className="pd-h" style={{ marginTop: 0 }}>Zaroori Links</h2>
      <div className="pd-row">
        <Link className="pbtn pbtn-gold" href="/tasks">📋 Mere Tasks</Link>
        <Link className="pbtn pbtn-ghost" href="/courses">📚 Courses</Link>
      </div>
    </section>
  </div>;
}

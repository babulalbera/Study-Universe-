import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { coverUrl } from "@/lib/book-meta";
import type { Course } from "@/types/database";
import "./courses.css";

export const metadata: Metadata = { title: "Courses" };

type CourseRow = Course & { cover_path?: string | null };

function Card({ c, count }: { c: CourseRow; count: number }) {
  const img = coverUrl(c.cover_path);
  const ext = c.url ? /^https?:/.test(c.url) : false;
  const body = (
    <>
      <div className="cv-thumb">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" />
        ) : (
          <span className="cv-ph" aria-hidden="true">🎓</span>
        )}
      </div>
      <h3 className="cv-ctitle">{c.title}</h3>
      <p className="cv-sub">{[c.category, count > 0 ? `${count} Videos` : null].filter(Boolean).join(" · ") || "Course"}</p>
      <div className="cv-foot">
        <span>{count > 0 ? "Batch Collection" : "Course"}</span>
        <span>{count > 0 ? "खोलो ›" : c.url ? "Link खोलो ›" : "जल्द आएगा"}</span>
      </div>
    </>
  );
  if (count > 0) return <Link href={`/courses/${c.id}`} className="cv-card">{body}</Link>;
  if (c.url) return <a href={c.url} className="cv-card" {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</a>;
  return <div className="cv-card">{body}</div>;
}

export default async function CoursesPage() {
  let courses: CourseRow[] = [];
  const counts = new Map<string, number>();
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("courses").select("*").eq("is_published", true).order("sort_order").order("created_at", { ascending: false }).limit(60);
    courses = (data ?? []) as CourseRow[];
    if (courses.length) {
      const { data: vids } = await supabase.from("course_videos").select("course_id").eq("is_published", true).in("course_id", courses.map((c) => c.id)).limit(5000);
      ((vids ?? []) as { course_id: string }[]).forEach((v) => counts.set(v.course_id, (counts.get(v.course_id) ?? 0) + 1));
    }
  }
  return (
    <>
      <PageHeader title="🎓 Courses" subtitle="Free Courses और Playlists, एक ही जगह।" />
      {courses.length === 0 ? (
        <EmptyState icon="🎓" title="अभी कोई Course नहीं है" text="Admin Panel से Course जुड़ते ही यहाँ दिखेंगे।" />
      ) : (
        <div className="cv-grid">
          {courses.map((c) => <Card key={c.id} c={c} count={counts.get(c.id) ?? 0} />)}
        </div>
      )}
    </>
  );
}

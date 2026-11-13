import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { coverUrl } from "@/lib/book-meta";
import type { Course } from "@/types/database";
import "./courses.css";
import "./courses-list.css"; // Courses list ka premium card + 1/2 column grid (sirf is page ke liye)

export const metadata: Metadata = { title: "Courses" };

type CourseRow = Course & { cover_path?: string | null };

function Card({ c, count, i }: { c: CourseRow; count: number; i: number }) {
  const img = coverUrl(c.cover_path);
  const ext = c.url ? /^https?:/.test(c.url) : false;
  const soon = count === 0 && !c.url;
  const cls = `cv-card cv-course${soon ? " is-soon" : ""}`;
  const style = { "--i": i } as CSSProperties; // card ek-ek karke aate hain (stagger)
  const body = (
    <>
      <div className="cv-thumb">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" />
        ) : (
          <span className="cv-ph" aria-hidden="true">🎓</span>
        )}
        <span className="cv-scrim" aria-hidden="true" />
        {count > 0 && <span className="cv-vids">▶ {count} Videos</span>}
      </div>
      <div className="cv-cbody">
        {c.category && <span className="cv-cat">{c.category}</span>}
        <h3 className="cv-ctitle">{c.title}</h3>
        {c.description && <p className="cv-desc">{c.description}</p>}
        <div className="cv-cfoot">
          <span className="cv-kind">{count > 0 ? "Batch Collection" : "Course"}</span>
          <span className="cv-cta">{count > 0 ? "खोलो ›" : c.url ? "Link खोलो ›" : "जल्द आएगा"}</span>
        </div>
      </div>
    </>
  );
  if (count > 0) return <Link href={`/courses/${c.id}`} className={cls} style={style}>{body}</Link>;
  if (c.url) return <a href={c.url} className={cls} style={style} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</a>;
  return <div className={cls} style={style}>{body}</div>;
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
        <div className="cv-grid cv-grid-courses">
          {courses.map((c, i) => <Card key={c.id} c={c} count={counts.get(c.id) ?? 0} i={i} />)}
        </div>
      )}
    </>
  );
}

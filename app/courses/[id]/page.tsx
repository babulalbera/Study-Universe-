import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { videoThumbUrl } from "@/lib/course-thumbs";
import { orderContent, type CourseFolder, type CourseVideo } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../courses.css";

export const metadata: Metadata = { title: "Course" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VideoRow = CourseVideo & { thumb_path?: string | null };

function VideoCard({ courseId, v, n }: { courseId: string; v: VideoRow; n: number }) {
  const img = videoThumbUrl(v);
  return (
    <div className="cv-card">
      <Link href={`/courses/${courseId}/watch/${v.id}`} className="cv-thumb" aria-label={`${v.title} चलाओ`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span className="cv-ph" aria-hidden="true">🎬</span>
        )}
        <span className="cv-play" aria-hidden="true">▶</span>
        <span className="cv-badge">{n}</span>
      </Link>
      <h3 className="cv-ctitle">{v.title}</h3>
      <p className="cv-ready">● READY TO STREAM</p>
      <Link href={`/courses/${courseId}/watch/${v.id}`} className="cv-watch">▶ WATCH VIDEO</Link>
    </div>
  );
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id) || !isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const { data: cd } = await supabase.from("courses").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  if (!cd) notFound();
  const course = cd as Course;

  const [{ data: fd }, { data: vd }] = await Promise.all([
    supabase.from("course_folders").select("*").eq("course_id", id).eq("is_published", true).order("sort_order").order("created_at").limit(200),
    supabase.from("course_videos").select("*").eq("course_id", id).eq("is_published", true).order("sort_order").order("created_at").limit(1000),
  ]);
  const { groups, loose, flat } = orderContent((fd ?? []) as CourseFolder[], (vd ?? []) as VideoRow[]);
  const numberOf = (vid: string) => flat.findIndex((x) => x.id === vid) + 1;
  const shown = groups.filter((g) => g.videos.length > 0);

  return (
    <>
      <PageHeader title={course.title} subtitle={`All Contents · ${flat.length} Lectures`} />
      <div className="su-row" style={{ marginBottom: 12 }}>
        <Link href="/courses" className="su-btn">← सभी Courses</Link>
        {flat[0] && <Link href={`/courses/${id}/watch/${flat[0].id}`} className="su-btn su-btn-primary">▶ पहला Video चलाओ</Link>}
      </div>
      {course.description && <p style={{ fontFamily: "var(--dev)", marginBottom: 12 }}>{course.description}</p>}

      {flat.length === 0 ? (
        <EmptyState icon="🎬" title="अभी कोई Video नहीं है" text="Admin जैसे ही Videos जोड़ेगा, यहाँ दिखेंगे।" />
      ) : (
        <div className="cv-sections">
          {shown.map((g) => (
            <section key={g.folder.id} className="cv-section">
              <h3 className="cv-sh">📁 {g.folder.title} <span className="su-muted">({g.videos.length})</span></h3>
              <div className="cv-grid">{g.videos.map((v) => <VideoCard key={v.id} courseId={id} v={v as VideoRow} n={numberOf(v.id)} />)}</div>
            </section>
          ))}
          {loose.length > 0 && (
            <section className="cv-section">
              {shown.length > 0 && <h3 className="cv-sh">📄 अन्य Videos</h3>}
              <div className="cv-grid">{loose.map((v) => <VideoCard key={v.id} courseId={id} v={v as VideoRow} n={numberOf(v.id)} />)}</div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

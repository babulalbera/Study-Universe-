import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { VIDEO_SOURCE_LABEL } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../courses.css";

export const metadata: Metadata = { title: "Course" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Row({ courseId, v, n }: { courseId: string; v: CourseVideo; n: number }) {
  return (
    <Link href={`/courses/${courseId}/watch/${v.id}`} className="cv-row">
      <span className="cv-num">{n}</span>
      <span className="cv-title">
        {v.title}
        {v.description && <small className="su-muted">{v.description}</small>}
      </span>
      <span className="adm-tag">{VIDEO_SOURCE_LABEL[v.source]}</span>
    </Link>
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
  const { groups, loose, flat } = orderContent((fd ?? []) as CourseFolder[], (vd ?? []) as CourseVideo[]);
  const numberOf = (vid: string) => flat.findIndex((x) => x.id === vid) + 1;

  return (
    <>
      <PageHeader title={course.title} subtitle={course.description || "Videos नीचे हैं। जिस पर चाहो Tap करो।"} />
      <div className="su-row" style={{ marginBottom: 12 }}>
        <Link href="/courses" className="su-btn">← सभी Courses</Link>
        {flat[0] && <Link href={`/courses/${id}/watch/${flat[0].id}`} className="su-btn su-btn-primary">▶ पहला Video चलाओ</Link>}
      </div>

      {flat.length === 0 ? (
        <EmptyState icon="🎬" title="अभी कोई Video नहीं है" text="Admin जैसे ही Videos जोड़ेगा, यहाँ दिखेंगे।" />
      ) : (
        <div className="cv-list-wrap">
          {groups.filter((g) => g.videos.length > 0).map((g) => (
            <section key={g.folder.id} className="cv-folder">
              <h3>📁 {g.folder.title} <span className="su-muted">({g.videos.length})</span></h3>
              <div className="cv-list">{g.videos.map((v) => <Row key={v.id} courseId={id} v={v} n={numberOf(v.id)} />)}</div>
            </section>
          ))}
          {loose.length > 0 && (
            <section className="cv-folder">
              {groups.some((g) => g.videos.length > 0) && <h3>📄 अन्य Videos</h3>}
              <div className="cv-list">{loose.map((v) => <Row key={v.id} courseId={id} v={v} n={numberOf(v.id)} />)}</div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

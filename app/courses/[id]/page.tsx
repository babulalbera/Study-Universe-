import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { videoThumbUrl } from "@/lib/course-thumbs";
import { VIDEO_SOURCE_LABEL } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../courses.css";
import "./detail.css"; // Videos ka 1/2 column grid, folder box aur video card (sirf is page ke liye)

export const metadata: Metadata = { title: "Course" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VideoRow = CourseVideo & { thumb_path?: string | null };

function VideoCard({ courseId, v, n }: { courseId: string; v: VideoRow; n: number }) {
  const img = videoThumbUrl(v);
  const href = `/courses/${courseId}/watch/${v.id}`;
  const src = VIDEO_SOURCE_LABEL[v.source] ?? "";
  return (
    <div className="cv-card cv-vcard">
      <Link href={href} className="cv-thumb" aria-label={`${v.title} चलाओ`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span className="cv-ph" aria-hidden="true">🎬</span>
        )}
        <span className="cv-vscrim" aria-hidden="true" />
        <span className="cv-play" aria-hidden="true">▶</span>
      </Link>
      <div className="cv-vbody">
        <div className="cv-vmeta">
          <span className="cv-lec">Lecture {String(n).padStart(2, "0")}</span>
          {src && <span className="cv-src">{src}</span>}
          <span className="cv-ready">Ready</span>
        </div>
        <h3 className="cv-ctitle">{v.title}</h3>
        {v.description && <p className="cv-vdesc">{v.description}</p>}
        <Link href={href} className="cv-watch">▶ WATCH VIDEO</Link>
      </div>
    </div>
  );
}

// Folder ka dabba: band/khol sakte ho (bahut saare Folders hon to aasaani rehti hai)
function FolderBox({ icon, title, count, children }: { icon: string; title: string; count: number; children: ReactNode }) {
  return (
    <details className="cv-fbox" open>
      <summary className="cv-fhead">
        <span className="cv-ficon" aria-hidden="true">{icon}</span>
        <span className="cv-ftext">
          <b className="cv-ftitle">{title}</b>
          <small>{count} Videos</small>
        </span>
        <span className="cv-fchev" aria-hidden="true">›</span>
      </summary>
      <div className="cv-fbody">{children}</div>
    </details>
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
  const cards = (list: CourseVideo[]) => list.map((v) => <VideoCard key={v.id} courseId={id} v={v as VideoRow} n={numberOf(v.id)} />);

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
            <FolderBox key={g.folder.id} icon="📁" title={g.folder.title} count={g.videos.length}>
              <div className="cv-grid cv-grid-videos">{cards(g.videos)}</div>
            </FolderBox>
          ))}
          {loose.length > 0 &&
            (shown.length > 0 ? (
              <FolderBox icon="📄" title="अन्य Videos" count={loose.length}>
                <div className="cv-grid cv-grid-videos">{cards(loose)}</div>
              </FolderBox>
            ) : (
              <div className="cv-grid cv-grid-videos">{cards(loose)}</div>
            ))}
        </div>
      )}
    </>
  );
}

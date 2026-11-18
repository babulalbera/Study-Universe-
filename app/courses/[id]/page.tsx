import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import DoneTick from "@/components/courses/DoneTick";
import FolderCardShell from "@/components/courses/FolderCardShell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { coverUrl } from "@/lib/book-meta";
import { videoThumbUrl } from "@/lib/course-thumbs";
import { VIDEO_SOURCE_LABEL } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo, type FolderNode } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../courses.css";
import "./detail.css"; // Videos ka 1/2 column grid aur video card (sirf is page ke liye)
import "./folders.css"; // Folder cards

export const metadata: Metadata = { title: "Course" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VideoRow = CourseVideo & { thumb_path?: string | null };

// Folder ke andar (uske andar ke Folders samet) saare Videos, usi kram me jisme student ko dikhte hain
const collect = (n: FolderNode): CourseVideo[] => [...n.videos, ...n.children.flatMap(collect)];

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
      <DoneTick courseId={courseId} videoId={v.id} title={v.title} />
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

// Folder ka card: cover photo, naam, vivaran. Dabane par sirf usi Folder ke andar ka saaman khulta hai.
function FolderCard({ courseId, n, i }: { courseId: string; n: FolderNode; i: number }) {
  const f = n.folder;
  const first = collect(n)[0];
  const img = coverUrl(f.cover_path ?? null) || (first ? videoThumbUrl(first as VideoRow) : null); // photo na ho to pehle video ki thumbnail
  const subs = n.children.filter((c) => c.total > 0).length;
  return (
    <FolderCardShell courseId={courseId} folderId={f.id} title={f.title} index={i}>
    <Link href={`/courses/${courseId}?folder=${f.id}`} className="cvf-card" style={{ "--i": i } as CSSProperties}>
      <div className="cvf-thumb">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span className="cvf-ph" aria-hidden="true">📁</span>
        )}
        <span className="cvf-scrim" aria-hidden="true" />
        <span className="cvf-badge">▶ {n.total} Videos</span>
      </div>
      <div className="cvf-body">
        <h3 className="cvf-title">{f.title}</h3>
        {f.description ? <p className="cvf-desc">{f.description}</p> : null}
        <div className="cvf-foot">
          {subs > 0 ? <span className="cvf-meta">📁 {subs} Folder</span> : null}
          <span className="cvf-cta">खोलो ›</span>
        </div>
      </div>
    </Link>
    </FolderCardShell>
  );
}

export default async function CourseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ folder?: string }> }) {
  const { id } = await params;
  const { folder: folderParam } = await searchParams;
  if (!UUID.test(id) || !isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const { data: cd } = await supabase.from("courses").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  if (!cd) notFound();
  const course = cd as Course;

  const [{ data: fd }, { data: vd }] = await Promise.all([
    supabase.from("course_folders").select("*").eq("course_id", id).eq("is_published", true).order("sort_order").order("created_at").limit(200),
    supabase.from("course_videos").select("*").eq("course_id", id).eq("is_published", true).order("sort_order").order("created_at").limit(1000),
  ]);
  const { tree, groups, loose, flat } = orderContent((fd ?? []) as CourseFolder[], (vd ?? []) as VideoRow[]);
  const cards = (list: CourseVideo[]) => list.map((v, i) => <VideoCard key={v.id} courseId={id} v={v as VideoRow} n={i + 1} />); // Lecture number isi Folder ke hisaab se
  const folderCards = (list: FolderNode[]) => {
    const shown = list.filter((n) => n.total > 0);
    return shown.length > 0 ? <div className="cvf-grid">{shown.map((n, i) => <FolderCard key={n.folder.id} courseId={id} n={n} i={i} />)}</div> : null;
  };

  // Kaun sa Folder khula hai (?folder=...). Na mile ya chhipa ho to Course ka pehla (main) hissa dikhao.
  const cur = folderParam && UUID.test(folderParam) ? groups.find((g) => g.folder.id === folderParam) ?? null : null;
  const parent = cur?.folder.parent_id ? groups.find((g) => g.folder.id === cur.folder.parent_id) ?? null : null;
  const backHref = cur ? (parent ? `/courses/${id}?folder=${parent.folder.id}` : `/courses/${id}`) : "/courses";
  const backLabel = cur ? (parent ? `← ${parent.folder.title}` : "← सभी Folders") : "← सभी Courses";

  return (
    <>
      <PageHeader
        title={cur ? cur.folder.title : course.title}
        subtitle={cur ? `${course.title} · ${cur.total} Lectures` : `All Contents · ${flat.length} Lectures`}
      />
      <div className="su-row" style={{ marginBottom: 12 }}>
        <Link href={backHref} className="su-btn">{backLabel}</Link>
      </div>

      {!cur && course.description && <p style={{ fontFamily: "var(--dev)", marginBottom: 12 }}>{course.description}</p>}

      {cur ? (
        cur.total === 0 ? (
          <EmptyState icon="📁" title="इस Folder में अभी कुछ नहीं है" text="Admin जैसे ही Videos जोड़ेगा, यहाँ दिखेंगे।" />
        ) : (
          <div className="cvf-wrap">
            {cur.folder.description && <p className="cvf-intro">{cur.folder.description}</p>}
            {folderCards(cur.children)}
            {cur.videos.length > 0 && (
              <>
                {cur.children.some((c) => c.total > 0) && <h2 className="cvf-sec">🎬 Videos</h2>}
                <div className="cv-grid cv-grid-videos">{cards(cur.videos)}</div>
              </>
            )}
          </div>
        )
      ) : flat.length === 0 ? (
        <EmptyState icon="🎬" title="अभी कोई Video नहीं है" text="Admin जैसे ही Videos जोड़ेगा, यहाँ दिखेंगे।" />
      ) : (
        <div className="cvf-wrap">
          {folderCards(tree)}
          {loose.length > 0 && (
            <>
              {tree.some((n) => n.total > 0) && <h2 className="cvf-sec">📄 अन्य Videos</h2>}
              <div className="cv-grid cv-grid-videos">{cards(loose)}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}

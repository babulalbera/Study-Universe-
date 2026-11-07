import Link from "next/link";
import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import CourseVideoAdd from "@/components/admin/CourseVideoAdd";
import CoverPicker from "@/components/admin/CoverPicker";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveFolder, deleteFolder, saveVideo, deleteVideo } from "@/features/admin/course-video-actions";
import { VIDEO_SOURCE_LABEL } from "@/lib/video-links";
import type { Course } from "@/types/database";

type CourseRow = Course & { cover_path?: string | null };
import type { CourseFolder, CourseVideo } from "@/types/course-content";

type VideoRow = CourseVideo & { thumb_path?: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function FolderFields({ courseId, f }: { courseId: string; f?: CourseFolder }) {
  return (
    <div className="grid gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      {f && <input type="hidden" name="id" value={f.id} />}
      <Field label="Folder का नाम (जैसे Maths, Reasoning)" name="title" defaultValue={f?.title} required />
      <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={f?.sort_order ?? 0} />
      <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={f ? f.is_published : true} /> Students को दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

function VideoFields({ courseId, v, folders }: { courseId: string; v: CourseVideo; folders: CourseFolder[] }) {
  return (
    <div className="grid gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="id" value={v.id} />
      <Field label="Video का Title" name="title" defaultValue={v.title} required />
      <Field label="छोटा विवरण" name="description" rows={2} defaultValue={v.description} />
      <label className="su-field"><span>Folder</span>
        <select name="folder_id" defaultValue={v.folder_id ?? ""}>
          <option value="">— बिना Folder —</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </label>
      {v.source !== "upload" && <Field label="Video का Link" name="url" defaultValue={v.url ?? ""} placeholder="https://..." />}
      <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={v.sort_order} />
      <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={v.is_published} /> Students को दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

function VideoItem({ courseId, v, folders }: { courseId: string; v: VideoRow; folders: CourseFolder[] }) {
  return (
    <details className="adm-d">
      <summary>
        <span>{v.title}</span>
        <span className="adm-tag">{VIDEO_SOURCE_LABEL[v.source]}</span>
        <span className={`adm-tag ${v.is_published ? "" : "off"}`}>{v.is_published ? "दिख रहा" : "छिपा"}</span>
      </summary>
      <form action={saveVideo}><VideoFields courseId={courseId} v={v} folders={folders} /></form>
      <CoverPicker kind="video" courseId={courseId} videoId={v.id} current={v.thumb_path ?? null} />
      <form action={deleteVideo} className="su-row">
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="id" value={v.id} />
        <DeleteButton />
      </form>
    </details>
  );
}

export default async function AdminCourseContentPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: cd } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!cd) notFound();
  const course = cd as CourseRow;

  const [{ data: fd }, { data: vd }] = await Promise.all([
    supabase.from("course_folders").select("*").eq("course_id", id).order("sort_order").order("created_at").limit(200),
    supabase.from("course_videos").select("*").eq("course_id", id).order("sort_order").order("created_at").limit(1000),
  ]);
  const folders = (fd ?? []) as CourseFolder[];
  const videos = (vd ?? []) as VideoRow[];
  const loose = videos.filter((v) => !v.folder_id);

  return (
    <>
      <AdminHeader title={`📂 ${course.title}`} subtitle="Folders बनाओ और Videos जोड़ो" />
      <Flash ok={ok} error={error} />
      <div className="su-row"><Link href="/admin/courses" className="su-btn">← सभी Courses</Link></div>

      <details className="adm-d" open={!course.cover_path}>
        <summary>🖼️ Course की Photo (Courses page पर दिखती है)</summary>
        <CoverPicker kind="course" courseId={id} current={course.cover_path ?? null} label="Course Card की Photo" />
      </details>

      <details className="adm-d" open={videos.length === 0}>
        <summary>🎬 नया Video जोड़ो</summary>
        <CourseVideoAdd courseId={id} folders={folders.map((f) => ({ id: f.id, title: f.title }))} />
      </details>

      <details className="adm-d" open={folders.length === 0}>
        <summary>📁 नया Folder</summary>
        <form action={saveFolder}><FolderFields courseId={id} /></form>
      </details>

      {folders.map((f) => {
        const inside = videos.filter((v) => v.folder_id === f.id);
        return (
          <details key={f.id} className="adm-d">
            <summary>
              <span>📁 {f.title}</span>
              <span className="adm-tag">{inside.length} Video</span>
              <span className={`adm-tag ${f.is_published ? "" : "off"}`}>{f.is_published ? "दिख रहा" : "छिपा"}</span>
            </summary>
            <form action={saveFolder}><FolderFields courseId={id} f={f} /></form>
            {inside.length === 0 ? <p className="su-muted">इस Folder में अभी कोई Video नहीं।</p> : inside.map((v) => <VideoItem key={v.id} courseId={id} v={v} folders={folders} />)}
            <form action={deleteFolder} className="su-row">
              <input type="hidden" name="course_id" value={id} />
              <input type="hidden" name="id" value={f.id} />
              <DeleteButton />
            </form>
            <p className="su-muted">⚠️ Folder हटाने पर उसके सारे Videos भी हट जाते हैं।</p>
          </details>
        );
      })}

      {loose.length > 0 && (
        <>
          <h3 style={{ marginTop: 8 }}>📄 बिना Folder वाले Videos</h3>
          {loose.map((v) => <VideoItem key={v.id} courseId={id} v={v} folders={folders} />)}
        </>
      )}
    </>
  );
}

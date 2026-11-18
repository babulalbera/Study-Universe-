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
import { saveFolder, deleteFolder, saveVideo, deleteVideo } from "@/features/admin/folder-actions";
import { VIDEO_SOURCE_LABEL } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo, type FolderNode } from "@/types/course-content";
import type { Course } from "@/types/database";
import "./admin-simple.css";

type CourseRow = Course & { cover_path?: string | null };
type VideoRow = CourseVideo & { thumb_path?: string | null };
type Opt = { id: string; title: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Is Folder ke andar ke saare Folders ki id (Folder ko apne hi andar daalne se rokne ke liye)
const below = (n: FolderNode): string[] => n.children.flatMap((c) => [c.folder.id, ...below(c)]);

function VideoItem({ courseId, v, folders, ret }: { courseId: string; v: VideoRow; folders: Opt[]; ret: string }) {
  return (
    <details className="adm-d">
      <summary>
        <span>🎬 {v.title}</span>
        <span className="adm-tag">{VIDEO_SOURCE_LABEL[v.source]}</span>
        <span className={`adm-tag ${v.is_published ? "" : "off"}`}>{v.is_published ? "दिख रहा" : "छिपा"}</span>
      </summary>
      <form action={saveVideo} className="grid gap-3">
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="id" value={v.id} />
        <input type="hidden" name="return_folder" value={ret} />
        <Field label="Video का Title" name="title" defaultValue={v.title} required />
        <Field label="छोटा विवरण" name="description" rows={2} defaultValue={v.description} />
        {v.source !== "upload" && <Field label="Video का Link" name="url" defaultValue={v.url ?? ""} placeholder="https://..." />}
        <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={v.is_published} /> Students को दिखाओ</label>
        <details className="adm-d">
          <summary>और सेटिंग (दूसरे Folder में ले जाओ, क्रम)</summary>
          <label className="su-field"><span>कौन से Folder में रखना है</span>
            <select name="folder_id" defaultValue={v.folder_id ?? ""}>
              <option value="">— बिना Folder —</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </label>
          <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={v.sort_order} />
        </details>
        <button type="submit" className="pbtn pbtn-gold">Save करो</button>
      </form>
      <CoverPicker kind="video" courseId={courseId} videoId={v.id} current={v.thumb_path ?? null} />
      <form action={deleteVideo} className="su-row">
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="id" value={v.id} />
        <input type="hidden" name="return_folder" value={ret} />
        <DeleteButton />
      </form>
    </details>
  );
}

export default async function AdminCourseContentPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; folder?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { ok, error, folder: folderParam } = await searchParams;
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
  const { tree, groups, loose } = orderContent(folders, videos);
  const byId = new Map(groups.map((g) => [g.folder.id, g]));

  // Abhi kaun sa Folder khula hai (?folder=...). Na mile to Course ka pehla (main) hissa.
  const cur = folderParam && UUID.test(folderParam) ? byId.get(folderParam) ?? null : null;
  const here = cur?.folder.id ?? "";
  const parentId = cur?.folder.parent_id ?? "";
  const chain: FolderNode[] = [];
  for (let x: FolderNode | null | undefined = cur; x && chain.length < 10; x = x.folder.parent_id ? byId.get(x.folder.parent_id) : null) chain.unshift(x);

  const subFolders = cur ? cur.children : tree;
  const shownVideos = (cur ? cur.videos : loose) as VideoRow[];
  const allOpts: Opt[] = groups.map((g) => ({ id: g.folder.id, title: `${"— ".repeat(g.depth)}${g.trail}` })); // "Ssc cgl › Maths" jaise naam
  const empty = folders.length === 0 && videos.length === 0;
  const base = `/admin/courses/${id}`;
  const backHref = cur ? (parentId ? `${base}?folder=${parentId}` : base) : "/admin/courses";

  return (
    <>
      <AdminHeader title={`📂 ${cur ? cur.folder.title : course.title}`} subtitle={cur ? "इस Folder का सामान" : "Folders बनाओ और Videos जोड़ो"} />
      <Flash ok={ok} error={error} />
      <div className="su-row"><Link href={backHref} className="su-btn">{cur ? "← वापस" : "← सभी Courses"}</Link></div>

      {cur && (
        <nav className="ads-crumbs" aria-label="Folder ka rasta">
          <Link href={base}>🏠 {course.title}</Link>
          {chain.map((n, i) => (
            <span key={n.folder.id}>
              {" › "}
              {i === chain.length - 1 ? <b>{n.folder.title}</b> : <Link href={`${base}?folder=${n.folder.id}`}>{n.folder.title}</Link>}
            </span>
          ))}
        </nav>
      )}

      <details className="adm-d" open={empty}>
        <summary>❓ कैसे करें (3 आसान Step)</summary>
        <ol className="ads-help">
          <li>📁 <b>नया Folder बनाओ</b> (जैसे Maths)।</li>
          <li>उस Folder पर <b>tap</b> करके उसे खोलो।</li>
          <li>अंदर <b>🎬 नया Video जोड़ो</b>। चाहो तो उसके अंदर और Folder भी बना सकते हो।</li>
        </ol>
      </details>

      <details className="adm-d">
        <summary>📁 नया Folder बनाओ{cur ? " (इसके अंदर)" : ""}</summary>
        <form action={saveFolder} className="grid gap-3">
          <input type="hidden" name="course_id" value={id} />
          <input type="hidden" name="parent_id" value={here} />
          <input type="hidden" name="is_published" value="on" />
          <input type="hidden" name="return_folder" value={here} />
          <Field label="Folder का नाम (जैसे Maths, Reasoning)" name="title" required />
          <Field label="छोटा विवरण (ज़रूरी नहीं)" name="description" rows={2} />
          <button type="submit" className="pbtn pbtn-gold">📁 Folder बनाओ</button>
        </form>
      </details>

      <details className="adm-d">
        <summary>🎬 नया Video जोड़ो{cur ? " (इसी Folder में)" : ""}</summary>
        <CourseVideoAdd key={here || "root"} courseId={id} folders={allOpts} defaultFolderId={here} />
      </details>

      {subFolders.length > 0 && (
        <>
          <p className="ads-h">📁 Folders (खोलने के लिए tap करो)</p>
          <div className="ads-list">
            {subFolders.map((n) => (
              <Link key={n.folder.id} href={`${base}?folder=${n.folder.id}`} className="ads-row">
                <span className="ads-ico" aria-hidden="true">📁</span>
                <span className="ads-main">
                  <b>{n.folder.title}</b>
                  <small>{n.total} Video{n.children.length > 0 ? ` · ${n.children.length} Folder` : ""}</small>
                </span>
                <span className={`adm-tag ${n.folder.is_published ? "" : "off"}`}>{n.folder.is_published ? "दिख रहा" : "छिपा"}</span>
                <span className="ads-go" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="ads-h">{cur ? "🎬 इस Folder के Videos" : "🎬 बिना Folder वाले Videos"}</p>
      {shownVideos.length > 0 ? (
        shownVideos.map((v) => <VideoItem key={v.id} courseId={id} v={v} folders={allOpts} ret={here} />)
      ) : (
        <p className="ads-empty">{cur ? "इस Folder में अभी कोई Video नहीं। ऊपर से 🎬 नया Video जोड़ो।" : "बिना Folder वाला कोई Video नहीं है।"}</p>
      )}

      {cur ? (
        <details className="adm-d">
          <summary>⚙️ इस Folder की सेटिंग (नाम, विवरण, Photo, हटाओ)</summary>
          <form action={saveFolder} className="grid gap-3">
            <input type="hidden" name="course_id" value={id} />
            <input type="hidden" name="id" value={cur.folder.id} />
            <input type="hidden" name="return_folder" value={cur.folder.id} />
            <Field label="Folder का नाम" name="title" defaultValue={cur.folder.title} required />
            <Field label="छोटा विवरण (Folder card पर दिखेगा)" name="description" rows={2} defaultValue={cur.folder.description ?? ""} />
            <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={cur.folder.is_published} /> Students को दिखाओ</label>
            <details className="adm-d">
              <summary>और सेटिंग (दूसरे Folder में ले जाओ, क्रम)</summary>
              <label className="su-field"><span>किस Folder के अंदर रखना है</span>
                <select name="parent_id" defaultValue={cur.folder.parent_id ?? ""}>
                  <option value="">— सबसे ऊपर (Main) —</option>
                  {allOpts.filter((o) => o.id !== cur.folder.id && !below(cur).includes(o.id)).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
              </label>
              <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={cur.folder.sort_order} />
            </details>
            <button type="submit" className="pbtn pbtn-gold">Save करो</button>
          </form>
          <CoverPicker kind="folder" courseId={id} folderId={cur.folder.id} current={cur.folder.cover_path ?? null} label="🖼️ Folder की Photo (Folder card पर दिखेगी)" />
          <form action={deleteFolder} className="su-row">
            <input type="hidden" name="course_id" value={id} />
            <input type="hidden" name="id" value={cur.folder.id} />
            <input type="hidden" name="return_folder" value={parentId} />
            <DeleteButton />
          </form>
          <p className="su-muted">⚠️ Folder हटाने पर उसके अंदर के Folders और सारे Videos भी हट जाते हैं।</p>
        </details>
      ) : (
        <details className="adm-d" open={!course.cover_path}>
          <summary>⚙️ Course की Photo (Courses page पर दिखती है)</summary>
          <CoverPicker kind="course" courseId={id} current={course.cover_path ?? null} label="Course Card की Photo" />
        </details>
      )}
    </>
  );
}

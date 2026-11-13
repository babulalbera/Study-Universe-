import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import PlayerStage from "@/components/courses/PlayerStage";
import ActiveRowScroll from "@/components/courses/ActiveRowScroll";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { VIDEO_SOURCE_LABEL, playerFor, type Player } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../../../courses.css";
import "./watch.css"; // Watch page ka layout (1 column, bade screen par 2) aur premium Playlist

export const metadata: Metadata = { title: "Lecture" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_SECONDS = 60 * 60 * 6; // upload kiye video ka link 6 ghante chalta hai

export default async function WatchPage({ params }: { params: Promise<{ id: string; videoId: string }> }) {
  const { id, videoId } = await params;
  if (!UUID.test(id) || !UUID.test(videoId) || !isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const { data: cd } = await supabase.from("courses").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  if (!cd) notFound();
  const course = cd as Course;

  const [{ data: fd }, { data: vd }] = await Promise.all([
    supabase.from("course_folders").select("*").eq("course_id", id).eq("is_published", true).order("sort_order").order("created_at").limit(200),
    supabase.from("course_videos").select("*").eq("course_id", id).eq("is_published", true).order("sort_order").order("created_at").limit(1000),
  ]);
  const { groups, loose, flat } = orderContent((fd ?? []) as CourseFolder[], (vd ?? []) as CourseVideo[]);
  const idx = flat.findIndex((v) => v.id === videoId);
  if (idx < 0) notFound(); // video nahi mila, chhipa hai, ya uska Folder chhipa hai
  const video = flat[idx];
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  const prevHref = prev ? `/courses/${id}/watch/${prev.id}` : null;
  const nextHref = next ? `/courses/${id}/watch/${next.id}` : null;
  const folderName = video.folder_id ? groups.find((g) => g.folder.id === video.folder_id)?.folder.title ?? null : null;
  const pct = Math.round(((idx + 1) / flat.length) * 100);

  let player: Player | null = null;
  if (video.source === "upload" && video.storage_path) {
    const { data } = await supabase.storage.from("course-videos").createSignedUrl(video.storage_path, SIGNED_SECONDS);
    if (data?.signedUrl) player = { kind: "video", src: data.signedUrl };
  } else {
    player = playerFor(video.source, video.url);
  }

  const item = (v: CourseVideo) => {
    const on = v.id === video.id;
    return (
      <Link key={v.id} href={`/courses/${id}/watch/${v.id}`} className={`cv-row ${on ? "on" : ""}`} aria-current={on ? "true" : undefined}>
        <span className="cv-num">{on ? "▶" : flat.findIndex((x) => x.id === v.id) + 1}</span>
        <span className="cv-title">{v.title}</span>
      </Link>
    );
  };

  return (
    <>
      <PageHeader title={video.title} subtitle={course.title} />
      <div className="cv-wrap cv-wrap-watch">
        <div className="cv-main">
          {player ? (
            <PlayerStage
              key={video.id}
              kind={player.kind}
              src={player.src}
              title={video.title}
              videoId={video.id}
              portraitHint={!!video.url && video.url.includes("/shorts/")}
              openUrl={video.url}
              nextHref={nextHref}
            />
          ) : (
            <div className="cvp-failbox">
              <span aria-hidden="true">🎬</span>
              <p>Video यहाँ नहीं चल पाया।</p>
              {video.url && <a className="cv-pbtn cv-pbtn-main" href={video.url} target="_blank" rel="noopener noreferrer">🔗 बाहर खोलो</a>}
            </div>
          )}

          <nav className="cv-pnav" aria-label="Video badlo">
            <Link href={`/courses/${id}`} className="cv-pbtn cv-pbtn-all" aria-label="सारे Videos">📚<span className="cv-hide-sm"> सारे Videos</span></Link>
            {prevHref ? <Link href={prevHref} className="cv-pbtn">← पिछला</Link> : <span className="cv-pbtn is-off" aria-disabled="true">← पिछला</span>}
            {nextHref ? <Link href={nextHref} className="cv-pbtn cv-pbtn-main">अगला →</Link> : <span className="cv-pbtn is-off" aria-disabled="true">अगला →</span>}
          </nav>

          <section className="cv-pinfo">
            <div className="cv-pchips">
              <span className="cv-chip cv-chip-gold">Lecture {idx + 1} / {flat.length}</span>
              <span className="cv-chip">{VIDEO_SOURCE_LABEL[video.source]}</span>
              {folderName && <span className="cv-chip">📁 {folderName}</span>}
            </div>
            {video.description && <p className="cv-pdesc">{video.description}</p>}
            {(video.source === "drive" || video.source === "mega") && (
              <p className="cv-tip">💡 Video अटक रहा हो तो Full Screen करो, “दोबारा” दबाओ या “बाहर खोलो” से देखो। {video.source === "drive" ? "Drive" : "MEGA"} की अपनी Speed Limit होती है।</p>
            )}
          </section>
        </div>

        <aside className="cv-side cv-side-pro" aria-label="Playlist">
          <ActiveRowScroll />
          <h3 className="cv-side-title">📚 Playlist ({flat.length})</h3>
          <div className="cv-prog" role="progressbar" aria-valuemin={0} aria-valuemax={flat.length} aria-valuenow={idx + 1} aria-label="Course me abhi kahan ho">
            <span style={{ width: `${pct}%` }} />
          </div>
          {groups.filter((g) => g.videos.length > 0).map((g) => (
            <div key={g.folder.id} className="cv-folder">
              <h4>📁 {g.folder.title}</h4>
              <div className="cv-list">{g.videos.map(item)}</div>
            </div>
          ))}
          {loose.length > 0 && (
            <div className="cv-folder">
              {groups.some((g) => g.videos.length > 0) && <h4>📄 अन्य Videos</h4>}
              <div className="cv-list">{loose.map(item)}</div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

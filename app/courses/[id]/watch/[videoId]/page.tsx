import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import PlayerStage from "@/components/courses/PlayerStage";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { VIDEO_SOURCE_LABEL, playerFor, type Player } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../../../courses.css";

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

  let player: Player | null = null;
  if (video.source === "upload" && video.storage_path) {
    const { data } = await supabase.storage.from("course-videos").createSignedUrl(video.storage_path, SIGNED_SECONDS);
    if (data?.signedUrl) player = { kind: "video", src: data.signedUrl };
  } else {
    player = playerFor(video.source, video.url);
  }

  const item = (v: CourseVideo) => (
    <Link key={v.id} href={`/courses/${id}/watch/${v.id}`} className={`cv-row ${v.id === video.id ? "on" : ""}`} aria-current={v.id === video.id ? "true" : undefined}>
      <span className="cv-num">{flat.findIndex((x) => x.id === v.id) + 1}</span>
      <span className="cv-title">{v.title}</span>
    </Link>
  );

  return (
    <>
      <PageHeader title={video.title} subtitle={course.title} />
      <div className="cv-wrap">
        <div>
          {player ? (
            <PlayerStage
              key={video.id}
              kind={player.kind}
              src={player.src}
              title={video.title}
              portraitHint={!!video.url && video.url.includes("/shorts/")}
            />
          ) : (
            <div className="cv-stage">
              <div className="cv-fail">
                <p>Video यहाँ नहीं चल पाया।</p>
                {video.url && <a className="su-btn su-btn-primary" href={video.url} target="_blank" rel="noopener noreferrer">🔗 बाहर खोलो</a>}
              </div>
            </div>
          )}

          <div className="cv-nav">
            {prev ? <Link href={`/courses/${id}/watch/${prev.id}`} className="su-btn">← पिछला</Link> : <span />}
            <Link href={`/courses/${id}`} className="su-btn">📚 सारे Videos</Link>
            {next ? <Link href={`/courses/${id}/watch/${next.id}`} className="su-btn su-btn-primary">अगला →</Link> : <span />}
          </div>

          <div className="cv-info">
            <span className="adm-tag">{VIDEO_SOURCE_LABEL[video.source]}</span>
            {video.description && <p style={{ fontFamily: "var(--dev)" }}>{video.description}</p>}
            {(video.source === "drive" || video.source === "mega") && (
              <p className="su-muted">Video अटक रहा हो तो Full Screen करो या नेट बदलकर देखो। {video.source === "drive" ? "Drive" : "MEGA"} की अपनी Speed Limit होती है।</p>
            )}
          </div>
        </div>

        <aside className="cv-side" aria-label="Playlist">
          <h3 className="cv-side-title">📚 Playlist ({flat.length})</h3>
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PlayerStage from "@/components/courses/PlayerStage";
import PlaylistPanel, { type PlaylistSection } from "@/components/courses/PlaylistPanel";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { playerFor, type Player } from "@/lib/video-links";
import { orderContent, type CourseFolder, type CourseVideo } from "@/types/course-content";
import type { Course } from "@/types/database";
import "../../../courses.css";
import "./watch.css"; // Watch page ka layout (1 column, bade screen par 2) aur premium Playlist
import "./watch-title.css"; // Video ke neeche naam wali patti

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
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  const nextHref = next ? `/courses/${id}/watch/${next.id}` : null; // video khatam hone par auto-next ke liye
  const backHref = video.folder_id ? `/courses/${id}?folder=${video.folder_id}` : `/courses/${id}`; // Wapas: isi Folder me
  const folderName = video.folder_id ? groups.find((g) => g.folder.id === video.folder_id)?.trail ?? null : null;

  let player: Player | null = null;
  if (video.source === "upload" && video.storage_path) {
    const { data } = await supabase.storage.from("course-videos").createSignedUrl(video.storage_path, SIGNED_SECONDS);
    if (data?.signedUrl) player = { kind: "video", src: data.signedUrl };
  } else {
    player = playerFor(video.source, video.url);
  }
  // YouTube se "kitna chala / speed / khatam" jaanne ke liye uska JS-API chalu karo
  if (player && player.kind === "iframe" && video.source === "youtube") {
    player = { ...player, src: `${player.src}${player.src.includes("?") ? "&" : "?"}enablejsapi=1` };
  }

  // Playlist (client component) ko sirf zaroori jaankari do
  const numOf = new Map(flat.map((v, i) => [v.id, i + 1]));
  const items = (list: CourseVideo[]) => list.map((v) => ({ id: v.id, title: v.title, n: numOf.get(v.id) ?? 0 }));
  const withVideos = groups.filter((g) => g.videos.length > 0);
  const sections: PlaylistSection[] = [
    ...withVideos.map((g) => ({ key: g.folder.id, title: `📁 ${g.trail}`, items: items(g.videos) })),
    ...(loose.length > 0 ? [{ key: "loose", title: withVideos.length > 0 ? "📄 अन्य Videos" : null, items: items(loose) }] : []),
  ];

  const tip =
    video.source === "drive" || video.source === "mega"
      ? `💡 ${video.source === "drive" ? "Drive" : "MEGA"} ka player unka apna hai: video par tap karke chalao. अटक रहा हो तो “दोबारा” दबाओ, Full Screen करो या “बाहर खोलो” से देखो। नया upload किया video कुछ देर “processing” में रह सकता है।`
      : null;

  return (
    <div className="cv-wrap cv-wrap-watch">
      <div className="cv-main">
        {player ? (
          <PlayerStage
            key={video.id}
            kind={player.kind}
            src={player.src}
            title={video.title}
            videoId={video.id}
            courseId={id}
            source={video.source}
            portraitHint={!!video.url && video.url.includes("/shorts/")}
            openUrl={video.url}
            nextHref={nextHref}
            backHref={backHref}
          />
        ) : (
          <div className="cvp-failbox">
            <span aria-hidden="true">🎬</span>
            <p>Video यहाँ नहीं चल पाया।</p>
            {video.url && <a className="cv-pbtn cv-pbtn-main" href={video.url} target="_blank" rel="noopener noreferrer">🔗 बाहर खोलो</a>}
          </div>
        )}

        <section className="cv-pinfo">
          <div className="cv-vtitlerow">
            <Link href={backHref} className="cv-pbtn cv-pbtn-all" aria-label="सारे Videos">📚</Link>
            <div className="cv-vtext">
              <h1 className="cv-vtitle">{video.title}</h1>
              <p className="cv-vcourse">{course.title}</p>
            </div>
          </div>
          <div className="cv-pchips">
            <span className="cv-chip cv-chip-gold">Lecture {idx + 1} / {flat.length}</span>
            {folderName && <span className="cv-chip">📁 {folderName}</span>}
          </div>
          {video.description && <p className="cv-pdesc">{video.description}</p>}
          {tip && <p className="cv-tip">{tip}</p>}
        </section>
      </div>

      <PlaylistPanel courseId={id} currentId={video.id} total={flat.length} sections={sections} />
    </div>
  );
}

import type { VideoSource } from "@/lib/video-links";

export type CourseFolder = { id: string; course_id: string; title: string; sort_order: number; is_published: boolean };
export type CourseVideo = {
  id: string; course_id: string; folder_id: string | null; title: string; description: string;
  source: VideoSource; url: string | null; storage_path: string | null; sort_order: number; is_published: boolean;
};

// Student ko jis kram me dikhana hai: pehle Folders (unke Videos ke saath), phir bina-Folder wale Videos.
// Jis Video ka Folder chhipa hai wo apne aap bahar ho jata hai.
export function orderContent(folders: CourseFolder[], videos: CourseVideo[]) {
  const groups = folders.map((f) => ({ folder: f, videos: videos.filter((v) => v.folder_id === f.id) }));
  const loose = videos.filter((v) => !v.folder_id);
  const flat = [...groups.flatMap((g) => g.videos), ...loose];
  return { groups, loose, flat };
}

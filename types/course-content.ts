import type { VideoSource } from "@/lib/video-links";

export type CourseFolder = { id: string; course_id: string; parent_id?: string | null; title: string; sort_order: number; is_published: boolean };
export type CourseVideo = {
  id: string; course_id: string; folder_id: string | null; title: string; description: string;
  source: VideoSource; url: string | null; storage_path: string | null; sort_order: number; is_published: boolean;
};

// Folder ka ek dabba: apne Videos + andar ke Folders (children). total = andar tak ke saare Videos.
export type FolderNode = { folder: CourseFolder; videos: CourseVideo[]; children: FolderNode[]; depth: number; trail: string; total: number };

// Student ko jis kram me dikhana hai: Folders (andar Folder bhi), unke Videos, phir bina-Folder wale Videos.
// Jis Folder ya uske upar wale Folder ko chhipa diya ho, wo aur uske Videos apne aap bahar ho jate hain.
// groups = saare Folders ek line me (upar se neeche ke kram me), tree = Folder ke andar Folder wala roop.
export function orderContent(folders: CourseFolder[], videos: CourseVideo[]) {
  const ids = new Set(folders.map((f) => f.id));
  const kids = new Map<string | null, CourseFolder[]>();
  for (const f of folders) {
    const p = f.parent_id ?? null;
    if (p !== null && !ids.has(p)) continue; // upar wala Folder nahi mila / chhipa hai
    kids.set(p, [...(kids.get(p) ?? []), f]);
  }
  const build = (p: string | null, depth: number, trail: string): FolderNode[] =>
    (kids.get(p) ?? []).map((f) => {
      const t = trail ? `${trail} › ${f.title}` : f.title;
      const children = depth < 8 ? build(f.id, depth + 1, t) : [];
      const own = videos.filter((v) => v.folder_id === f.id);
      return { folder: f, videos: own, children, depth, trail: t, total: own.length + children.reduce((n, c) => n + c.total, 0) };
    });
  const tree = build(null, 0, "");
  const groups: FolderNode[] = [];
  const walk = (list: FolderNode[]) => list.forEach((n) => { groups.push(n); walk(n.children); });
  walk(tree);
  const loose = videos.filter((v) => !v.folder_id);
  const flat = [...groups.flatMap((g) => g.videos), ...loose];
  return { tree, groups, loose, flat };
}

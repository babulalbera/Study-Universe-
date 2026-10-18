import type { Course } from "../types";
import { typeLabel } from "../utils";

interface AdminPanelProps {
  courses: Course[];
  editingFolderId: string | null;
  onEditFolder: (course?: Course) => void;
  onDeleteFolder: (id: string) => void;
  onManageVideos: (id: string) => void;
  onBackToFolders: () => void;
  onAddVideo: () => void;
  onEditVideo: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
}

export function AdminPanel({
  courses,
  editingFolderId,
  onEditFolder,
  onDeleteFolder,
  onManageVideos,
  onBackToFolders,
  onAddVideo,
  onEditVideo,
  onDeleteVideo,
}: AdminPanelProps) {
  const editingCourse = courses.find((c) => c.id === editingFolderId) || null;
  const totalVideos = courses.reduce((sum, c) => sum + c.videos.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="display text-[26px] font-extrabold tracking-tight">
            Admin Studio
          </h2>
          <p className="text-[13px] text-white/50 mt-1">
            Manage folders, videos, thumbnails — stored locally in your browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-[11px] tracking-[0.12em] font-bold text-white/40">
            TOTAL FOLDERS
          </p>
          <p className="display text-[28px] font-extrabold mt-1">
            {courses.length}
          </p>
          <p className="text-[12px] text-white/40 mt-1">
            Categories: {" "}
            {Array.from(new Set(courses.map((c) => c.cat))).join(", ")}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-[11px] tracking-[0.12em] font-bold text-white/40">
            TOTAL VIDEOS
          </p>
          <p className="display text-[28px] font-extrabold mt-1">
            {totalVideos}
          </p>
          <p className="text-[12px] text-white/40 mt-1">
            Supports YT / Drive / MEGA / MP4
          </p>
        </div>
        <div className="rounded-2xl p-4 border border-amber-300/20 bg-gradient-to-br from-amber-300/15 to-yellow-400/10">
          <p className="text-[11px] tracking-[0.12em] font-bold text-amber-200/70">
            PREMIUM ACTIVE
          </p>
          <p className="display text-[22px] font-extrabold mt-1 text-amber-100">
            Production Ready
          </p>
          <p className="text-[12px] text-amber-200/60 mt-1">
            Equal height cards • Fixed IDs • Footer furnished
          </p>
        </div>
      </div>

      {!editingFolderId ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Course Folders</h3>
            <button
              onClick={() => onEditFolder()}
              className="btn-gold h-9 rounded-full px-4 text-[13px]"
            >
              + New Folder
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="glass rounded-2xl border border-white/10 p-4 flex flex-col"
              >
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    {c.thumb ? (
                      <img
                        src={c.thumb}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-white/40">
                        🎓
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[14px] leading-tight line-clamp-1">
                      {c.title}
                    </p>
                    <p className="text-[12px] text-white/50 line-clamp-1">
                      {c.cat} • {c.videos.length} videos
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-white/45 line-clamp-2 min-h-[32px]">
                  {c.desc}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onEditFolder(c)}
                    className="flex-1 h-8 rounded-full bg-white text-black text-[12px] font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onManageVideos(c.id)}
                    className="flex-1 h-8 rounded-full bg-white/10 border border-white/10 text-[12px] font-semibold hover:bg-white/15"
                  >
                    Videos
                  </button>
                  <button
                    onClick={() => onDeleteFolder(c.id)}
                    className="h-8 w-8 rounded-full bg-red-500/15 border border-red-500/20 text-red-300 grid place-items-center hover:bg-red-500/25"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="glass rounded-2xl border border-white/10 p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-white/40">Editing videos for</p>
              <p className="font-bold text-[15px]">{editingCourse?.title}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onBackToFolders}
                className="h-8 rounded-full bg-white/10 border border-white/10 px-3 text-[12px]"
              >
                ← Back to folders
              </button>
              <button
                onClick={onAddVideo}
                className="h-8 rounded-full btn-gold px-3 text-[12px]"
              >
                + New Video
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            {editingCourse?.videos.map((v) => (
              <div
                key={v.id}
                className="glass rounded-xl border border-white/10 p-3 flex items-center gap-3"
              >
                <div className="h-10 w-14 rounded bg-black/50 border border-white/10 overflow-hidden shrink-0">
                  {v.thumb ? (
                    <img
                      src={v.thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-[10px] text-white/30">
                      {typeLabel(v.type)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">
                    {v.title}
                  </p>
                  <p className="text-[11px] text-white/45 truncate">
                    {v.type} • {v.dur} • {v.link.slice(0, 48)}
                  </p>
                </div>
                <button
                  onClick={() => onEditVideo(v.id)}
                  className="h-8 rounded-full bg-white text-black px-3 text-[12px] font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteVideo(v.id)}
                  className="h-8 w-8 rounded-full bg-red-500/15 border border-red-500/20 grid place-items-center text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
            {(editingCourse?.videos.length || 0) === 0 && (
              <div className="glass rounded-xl border border-white/10 p-8 text-center text-white/40 text-[13px]">
                No videos yet. Add first lecture.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

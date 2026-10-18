import type { Course, Video } from "../types";
import { typeLabel } from "../utils";

interface PlayerViewProps {
  course: Course | null;
  currentVideo: Video | null;
  onSelectVideo: (id: string) => void;
  onBack: () => void;
}

export function PlayerView({
  course,
  currentVideo,
  onSelectVideo,
  onBack,
}: PlayerViewProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 h-9 rounded-full glass px-4 border border-white/10 text-[13px] hover:bg-white/10"
      >
        ← Back to courses
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="video-wrap aspect-video w-full bg-black shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/10">
            {currentVideo ? (
              currentVideo.type === "youtube" ||
              currentVideo.type === "drive" ||
              currentVideo.type === "vimeo" ? (
                <iframe
                  src={currentVideo.embed}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentVideo.title}
                />
              ) : currentVideo.type === "mp4" ||
                currentVideo.type === "direct" ? (
                <video
                  src={currentVideo.embed}
                  controls
                  poster={currentVideo.thumb}
                />
              ) : (
                <div className="h-full w-full grid place-items-center p-8 text-center">
                  <div>
                    <div className="text-[13px] tracking-widest text-white/40 font-bold">
                      {typeLabel(currentVideo.type)}
                    </div>
                    <p className="mt-2 text-white/70">
                      This link opens externally (MEGA / Drive direct).
                    </p>
                    <a
                      href={currentVideo.embed}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex btn-gold h-10 rounded-full px-5 items-center"
                    >
                      Open Link ↗
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full w-full grid place-items-center text-white/40">
                Select a video
              </div>
            )}
          </div>

          <div className="mt-4 glass rounded-[16px] border border-white/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              {currentVideo && (
                <span className="rounded-full bg-amber-300 text-black px-2.5 py-1 text-[10px] font-black tracking-widest">
                  {typeLabel(currentVideo.type)}
                </span>
              )}
              {course && (
                <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] text-white/60">
                  {course.cat}
                </span>
              )}
              {currentVideo?.dur && (
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-white/50">
                  ⏱ {currentVideo.dur}
                </span>
              )}
            </div>
            <h2 className="display mt-3 text-[20px] sm:text-[22px] font-bold leading-tight">
              {currentVideo?.title || "Select a lecture"}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/60">
              {currentVideo?.desc ||
                "Choose from playlist to start focused study session."}
            </p>
          </div>
        </div>

        <div className="lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-[84px] glass rounded-[20px] border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[12px] tracking-[0.12em] font-bold text-white/40">
                  PLAYLIST
                </p>
                <h3 className="display font-bold text-[15px] mt-1 leading-tight line-clamp-1">
                  {course?.title}
                </h3>
              </div>
              <span className="h-7 min-w-7 grid place-items-center rounded-full bg-white text-black text-[12px] font-black px-2">
                {course?.videos.length || 0}
              </span>
            </div>
            <div className="max-h-[60vh] lg:max-h-[68vh] overflow-auto p-2 space-y-2">
              {course?.videos.map((v, idx) => {
                const isActive = v.id === currentVideo?.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVideo(v.id)}
                    className={`w-full text-left rounded-xl border p-2.5 flex gap-3 transition ${
                      isActive
                        ? "bg-amber-300/15 border-amber-300/30 shadow-[0_0_0_1px_rgba(250,204,21,0.15)_inset]"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                    }`}
                  >
                    <div className="h-12 w-16 rounded-lg bg-black/60 border border-white/10 overflow-hidden shrink-0 grid place-items-center relative">
                      {v.thumb ? (
                        <img
                          src={v.thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[12px] text-white/40">
                          {idx + 1}
                        </span>
                      )}
                      <span
                        className={`absolute bottom-0.5 right-0.5 text-[9px] px-1 rounded bg-black/80 border border-white/10 ${
                          isActive ? "text-amber-200" : "text-white/60"
                        }`}
                      >
                        {v.dur}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-semibold leading-[1.25] line-clamp-2 ${
                          isActive ? "text-amber-100" : "text-white/85"
                        }`}
                      >
                        {v.title}
                      </p>
                      <p className="mt-1 text-[11px] text-white/45 flex items-center gap-1.5">
                        <span className="inline-block rounded px-1 py-0.5 bg-white/10 border border-white/10 text-[9px] tracking-widest">
                          {typeLabel(v.type)}
                        </span>{" "}
                        {v.desc.slice(0, 36)}
                      </p>
                    </div>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(250,204,21,0.8)] mt-2 animate-pulse" />
                    )}
                  </button>
                );
              })}
              {(course?.videos.length || 0) === 0 && (
                <div className="p-6 text-center text-[13px] text-white/40">
                  No videos yet. Add from Admin.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

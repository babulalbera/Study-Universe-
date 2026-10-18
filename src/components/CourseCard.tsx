import type { Course } from "../types";

interface CourseCardProps {
  course: Course;
  index: number;
  onOpen: (id: string) => void;
}

export function CourseCard({ course, index, onOpen }: CourseCardProps) {
  return (
    <div className="glass rounded-[20px] overflow-hidden border border-white/[0.08] card-hover flex flex-col group">
      <div className="relative h-[200px] w-full overflow-hidden">
        {course.thumb ? (
          <img
            src={course.thumb}
            alt={course.title}
            className="h-full w-full object-cover group-hover:scale-[1.04] transition duration-500"
          />
        ) : (
          <div
            className={`h-full w-full grid place-items-center thumb-gradient-${
              index % 6
            } relative`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 grid place-items-center text-[22px] backdrop-blur">
              🎓
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-black/60 backdrop-blur border border-white/15 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/80">
            {course.cat.toUpperCase()}
          </span>
          <span className="rounded-full bg-amber-300 text-black px-2.5 py-1 text-[10px] font-black tracking-widest">
            {course.videos.length} VIDEOS
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="display font-bold text-[16px] leading-[1.2] line-clamp-2">
          {course.title}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.5] text-white/55 line-clamp-2 min-h-[40px]">
          {course.desc}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div className="text-[12px] text-white/40 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Premium • Offline ready
          </div>
          <button
            onClick={() => onOpen(course.id)}
            className="btn-gold h-9 rounded-full px-4 text-[13px] whitespace-nowrap"
          >
            Open →
          </button>
        </div>
      </div>
    </div>
  );
}

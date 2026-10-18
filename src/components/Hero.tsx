interface HeroProps {
  focusMode: boolean;
}

export function Hero({ focusMode }: HeroProps) {
  return (
    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start mb-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] tracking-[0.14em] font-semibold text-white/60 border border-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
          PREMIUM DARK • FOCUS MODE • 2026 EDITION
        </div>
        <h1 className="display mt-4 text-[32px] sm:text-[44px] leading-[0.95] font-extrabold tracking-[-0.03em]">
          Your{" "}
          <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            Premium
          </span>{" "}
          Courses
          <br />
          <span className="text-white/90">Crafted for toppers.</span>
        </h1>
        <p className="mt-4 text-[14px] sm:text-[15px] leading-relaxed text-white/55 max-w-[56ch]">
          Fixed layouts, equal-height boxes, proper folder grouping and
          distraction-free player. All uploads, thumbnails and videos are
          preserved in your browser — no backend needed.
        </p>
        {!focusMode && (
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="glass rounded-full px-3 py-1.5 text-[12px] text-white/60 border border-white/10">
              ⚡ Instant parse: YouTube / Drive / MEGA / Vimeo / MP4
            </div>
            <div className="glass rounded-full px-3 py-1.5 text-[12px] text-white/60 border border-white/10">
              🎯 Search + category chips + persistent storage
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-[20px] p-4 sm:p-5 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-300/20 blur-[30px]" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[12px] tracking-[0.14em] font-bold text-white/40">
              SUPPORTED SOURCES
            </p>
            <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/20 text-emerald-200">
              Live
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { k: "YT", v: "YouTube" },
              { k: "GD", v: "Drive" },
              { k: "MG", v: "MEGA" },
              { k: "VM", v: "Vimeo" },
              { k: "MP4", v: "Direct" },
              { k: "TH", v: "Upload" },
            ].map((h) => (
              <div
                key={h.k}
                className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
              >
                <div className="text-[11px] font-black tracking-widest text-white/50">
                  {h.k}
                </div>
                <div className="text-[13px] font-semibold text-white/80">
                  {h.v}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[12px] text-white/45">
            <div className="h-7 w-7 rounded-full bg-white/10 grid place-items-center">
              ◐
            </div>
            Storage key:{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/70">
              su_premium
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

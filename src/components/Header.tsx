interface HeaderProps {
  focusMode: boolean;
  toggleFocus: () => void;
  view: "user" | "admin";
  toggleView: () => void;
}

export function Header({
  focusMode,
  toggleFocus,
  view,
  toggleView,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/[0.06] backdrop-blur-[18px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-200 to-yellow-400 grid place-items-center text-black font-black text-[16px] shadow-[0_8px_20px_rgba(250,204,21,0.35)]">
            S
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="display font-extrabold tracking-tight text-[16px] sm:text-[18px] whitespace-nowrap">
                Study Universe
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-amber-300/15 border border-amber-300/20 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-amber-200">
                PREMIUM
              </span>
            </div>
            <div className="text-[11px] text-white/45 -mt-0.5 hidden sm:block tracking-wide">
              Production • Dark • Focus
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFocus}
            className={`h-8 rounded-full px-3 text-[12px] font-semibold border transition flex items-center gap-1.5 ${
              focusMode
                ? "bg-white text-black border-white"
                : "glass text-white/80 border-white/10 hover:bg-white/10"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                focusMode ? "bg-black" : "bg-emerald-400 animate-pulse"
              }`}
            />
            Focus Mode
          </button>
          <button
            onClick={toggleView}
            className={`h-9 rounded-full px-4 text-[13px] font-bold border transition ${
              view === "admin"
                ? "bg-white text-black border-white"
                : "btn-gold border-amber-300"
            }`}
          >
            {view === "admin" ? "← Back to Courses" : "Admin"}
          </button>
        </div>
      </div>
    </header>
  );
}

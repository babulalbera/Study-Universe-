import { CATEGORIES } from "../types";

interface FooterProps {
  onCategoryClick: (cat: string) => void;
}

export function Footer({ onCategoryClick }: FooterProps) {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#080c09]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-200 to-yellow-400 grid place-items-center text-black font-black">
                S
              </div>
              <span className="display font-extrabold">Study Universe</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/50 max-w-[28ch]">
              Premium dark LMS built for SSC, Banking, Railway & creative
              learners. Fixed boxes, focus player, local-first.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1.5 text-[11px] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All data stored in browser • No tracking
            </div>
          </div>

          <div>
            <p className="text-[12px] tracking-[0.14em] font-bold text-white/40">
              CATEGORIES
            </p>
            <ul className="mt-3 space-y-2 text-[13px] text-white/60">
              {CATEGORIES.filter((c) => c !== "all").map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onCategoryClick(cat)}
                    className="hover:text-white transition text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[12px] tracking-[0.14em] font-bold text-white/40">
              SUPPORT
            </p>
            <ul className="mt-3 space-y-2 text-[13px] text-white/60">
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  How to add videos
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  Keyboard shortcuts
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  Report a bug
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[12px] tracking-[0.14em] font-bold text-white/40">
              CONTACT
            </p>
            <ul className="mt-3 space-y-2 text-[13px] text-white/60">
              <li>study.universe@premium.test</li>
              <li>+91 90000 00000</li>
              <li>Indore, MP • Remote</li>
              <li className="pt-2">
                <span className="inline-flex rounded-full bg-amber-300/15 border border-amber-300/20 px-2.5 py-1 text-[11px] text-amber-200 font-bold">
                  Response &lt; 2h
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-white/35">
          <p>© 2026 Study Universe — Made for students with focus & precision.</p>
          <p className="flex items-center gap-2">
            <span className="h-px w-8 bg-white/10 hidden sm:block" />
            Premium Dark • Grid BG • Glass & Aurora • Fully furnished footer
          </p>
        </div>
      </div>
    </footer>
  );
}

import { CATEGORIES } from "../types";

interface FilterBarProps {
  active: string;
  setActive: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
}

export function FilterBar({
  active,
  setActive,
  search,
  setSearch,
}: FilterBarProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`chip rounded-full px-4 h-9 text-[13px] ${
              active === cat ? "chip-active" : ""
            }`}
          >
            {cat === "all" ? "All Courses" : cat}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="glass rounded-2xl flex items-center gap-3 px-4 h-12 border border-white/10 focus-within:border-amber-300/30 focus-within:shadow-[0_0_0_4px_rgba(250,204,21,0.12)] transition">
          <span className="text-white/40">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, subjects, tags..."
            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-white/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="h-7 w-7 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 text-white/60"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </>
  );
}

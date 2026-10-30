export type Piece = { id: number; x: number; y: number; color: string };

const COLORS = ["#10b981", "#D4AF37", "#fbbf24", "#34d399", "#FF6B00"];

// Screen ke beech ke paas 24 rang-birange tukde banao (purane app jaisa)
export function makeConfetti(): Piece[] {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.55;
  return Array.from({ length: 24 }, (_, i) => ({
    id: Date.now() + i, x: cx + (Math.random() * 180 - 90), y: cy + (Math.random() * 60 - 30), color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

export default function Confetti({ pieces }: { pieces: Piece[] }) {
  if (pieces.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[99]" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} className="tk-confetti absolute h-3.5 w-2.5 rounded-[2px]" style={{ left: p.x, top: p.y, background: p.color }} />
      ))}
    </div>
  );
}

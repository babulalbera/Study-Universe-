import Image from "next/image";

// Neeche wala Krishna box (Home se nikal kar sab pages ke liye)
export default function KrishnaStrip() {
  return (
    <section className="glass status rv">
      <div className="avatar">
        <Image src="/images/status-krishna.webp" alt="" width={54} height={54} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="st1">
          <span>Best banao, roz jeeto</span><span>•</span>
          <span style={{ color: "#a7f3d0" }}>Premium Edit</span><span>•</span>
          <span style={{ color: "var(--gold2)" }}>Jai Shri Krishna</span>
        </div>
        <div className="st2">Premium dark • Gold+Emerald aura • Focus mode • Reset Din</div>
      </div>
    </section>
  );
}

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[#030805]" />
      <div className="grid-bg absolute inset-0 opacity-[0.35]" />
      <div className="aurora">
        <div className="aurora-1" />
        <div className="aurora-2" />
        <div className="aurora-3" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030805]" />
    </div>
  );
}

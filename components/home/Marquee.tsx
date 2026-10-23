const ITEMS = ["SSC CGL", "Army GD", "General Knowledge", "Quant", "Reasoning", "English", "Current Affairs", "General Science", "Mock Tests", "Daily Streak"];

function Row({ id }: { id: string }) {
  return (
    <>
      {ITEMS.map((t, i) => (
        <span key={`${id}-${t}`}>{i % 3 === 1 ? <em>{t}</em> : t}<b /></span>
      ))}
    </>
  );
}

// Chalti hui subjects ki patti (sirf sajawat — screen reader ke liye chhupi hai)
export default function Marquee() {
  return (
    <div className="mq rv" aria-hidden="true">
      <div className="mq-t"><Row id="a" /><Row id="b" /></div>
    </div>
  );
}

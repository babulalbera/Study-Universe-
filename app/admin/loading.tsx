// Admin ka Page badalte waqt "kuch ho raha hai" dikhao (khali screen nahi)
export default function AdminLoading() {
  return (
    <div className="glass" style={{ padding: 18 }} aria-busy="true">
      ⏳ खुल रहा है…
    </div>
  );
}

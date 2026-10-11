"use client";

export default function DeleteButton({ label = "हटाओ" }: { label?: string }) {
  return (
    <button type="submit" className="pbtn pbtn-ghost" onClick={(e) => { if (!window.confirm("पक्का हटाना है? यह वापस नहीं आएगा।")) e.preventDefault(); }}>
      🗑 {label}
    </button>
  );
}

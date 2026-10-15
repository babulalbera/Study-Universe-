"use client";
import { useState, useTransition } from "react";
import { toggleBookmark } from "./actions";

export default function BookmarkButton({ bookId, saved, loggedIn }: { bookId: string; saved: boolean; loggedIn: boolean }) {
  const [on, setOn] = useState(saved);
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button type="button" className="su-btn su-btn-ghost" disabled={!loggedIn || pending} aria-pressed={on}
      title={loggedIn ? (on ? "Save se hatao" : "Save karo") : "Save karne ke liye Login karo"} aria-label={on ? "Bookmark hatao" : "Bookmark karo"}
      onClick={() => { setErr(false); start(async () => { const r = await toggleBookmark(bookId); if (r.ok) setOn(Boolean(r.saved)); else setErr(true); }); }}>
      {err ? "!" : on ? "⭐" : "☆"}
    </button>
  );
}

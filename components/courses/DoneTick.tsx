"use client";
import { useEffect, useState } from "react";
import { getDone, onDoneChange, setDone } from "@/lib/course-progress";
import "./done-tick.css";

// Video card ke thumbnail ke kone me gol button: dabao to ✓ aa jata hai (dekh liya), dobara dabao to hat jata hai.
// Watch page ke "Mark complete" se judta hai (dono ek hi hisaab use karte hain).
export default function DoneTick({ courseId, videoId, title }: { courseId: string; videoId: string; title: string }) {
  const [done, setDoneState] = useState(false);

  useEffect(() => {
    const sync = () => setDoneState(getDone(courseId).includes(videoId));
    sync();
    return onDoneChange(courseId, sync);
  }, [courseId, videoId]);

  const toggle = () => {
    const next = !done;
    setDoneState(next);
    setDone(courseId, videoId, next);
  };

  return (
    <button
      type="button"
      className={`cv-tick${done ? " on" : ""}`}
      onClick={toggle}
      aria-pressed={done}
      aria-label={done ? `${title}: dekh liya, hatane ke liye dabao` : `${title}: dekh liya mark karo`}
      title={done ? "Dekh liya ✓" : "Dekh liya mark karo"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </button>
  );
}

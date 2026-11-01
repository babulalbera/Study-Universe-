// Tasks page ke chhote SVG icons (emoji ki jagah). Sab decorative hain: button me text/aria-label alag se hota hai.
import type { ReactNode } from "react";

const I = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">{children}</svg>
);

export const IconDots = () => (<I><circle cx="12" cy="5" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="19" r="1.4" fill="currentColor" /></I>);
export const IconUndo = () => (<I><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></I>);
export const IconLock = () => (<I><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>);
export const IconUnlock = () => (<I><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></I>);
export const IconCheck = () => (<I><path d="m5 12.5 4.5 4.5L19 7.5" /></I>);
export const IconTarget = () => (<I><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></I>);
export const IconCalendar = () => (<I><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></I>);
export const IconBulb = () => (<I><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></I>);
export const IconFlame = () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.2 1.5 1 2.5 2 2.5 0-3 1-5.5 1-8z" /></svg>);
export const IconHourglass = () => (<I><path d="M6 3h12M6 21h12" /><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" /></I>);
export const IconEdit = () => (<I><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></I>);
export const IconPlus = () => (<I><path d="M12 5v14M5 12h14" /></I>);
export const IconFlag = () => (<I><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></I>);
export const IconBell = () => (<I><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" /><path d="M10 21a2 2 0 0 0 4 0" /></I>);
export const IconTrash = () => (<I><path d="M4 7h16M10 3h4M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></I>);
export const IconNote = () => (<I><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></I>);

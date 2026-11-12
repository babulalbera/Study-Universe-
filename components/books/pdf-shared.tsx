import type { ReactNode } from "react";

/* ---- pdf.js ke chhote types (taaki lint/type ka jhanjhat na ho) ---- */
export type RenderTask = { promise: Promise<void>; cancel: () => void };
export type Viewport = { width: number; height: number };
export type TextItem = { str?: string; transform?: number[]; width?: number; height?: number };
export type PageProxy = {
  view: number[];
  rotate: number;
  getViewport: (o: { scale: number }) => Viewport;
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: Viewport }) => RenderTask;
  getTextContent: () => Promise<{ items: TextItem[] }>;
};
export type OutlineNode = { title: string; dest: string | unknown[] | null; items?: OutlineNode[] };
export type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PageProxy>;
  destroy: () => Promise<void>;
  getOutline: () => Promise<OutlineNode[] | null>;
  getDestination: (id: string) => Promise<unknown[] | null>;
  getPageIndex: (ref: unknown) => Promise<number>;
};
export type LoadingTask = { promise: Promise<PdfDoc>; destroy: () => Promise<void>; onProgress?: (p: { loaded: number; total?: number }) => void };
export type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { url: string; disableAutoFetch?: boolean }) => LoadingTask;
};

export type Rendered = { canvas: HTMLCanvasElement; w: number; h: number };
export type Renderer = { get: (num: number, width: number, prefetch?: boolean) => Promise<Rendered | null> };

/* ---- Reader ke apne types ---- */
export type Theme = "paper" | "sepia" | "night";
export type Mode = "book" | "slide" | "scroll";
export type Tab = "search" | "toc" | "pages" | "saved" | "settings";
export type Mark = { l: number; t: number; w: number; h: number }; // % me (page ke upar peela nishaan)
export type Hit = { page: number; before: string; match: string; after: string };
export type TocRow = { title: string; depth: number; dest: OutlineNode["dest"]; page: number | null };

export const THEMES: Theme[] = ["paper", "sepia", "night"];
export const THEME_LABEL: Record<Theme, string> = { paper: "Paper", sepia: "Sepia", night: "Night" };
export const MAX_ZOOM = 4;

/* ---- Icons ---- */
const sv = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const IcBack = () => <svg {...sv}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const IcBook = () => <svg {...sv}><path d="M3 5.5C5.5 4.3 8.5 4.3 12 6c3.5-1.7 6.5-1.7 9-.5V19c-2.5-1.2-5.5-1.2-9 .5-3.5-1.7-6.5-1.7-9-.5V5.5Z" /><path d="M12 6v13.5" /></svg>;
export const IcSlide = () => <svg {...sv}><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" /></svg>;
export const IcScroll = () => <svg {...sv}><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" /></svg>;
export const IcTheme = () => <svg {...sv}><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" /></svg>;
export const IcFull = () => <svg {...sv}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
export const IcExit = () => <svg {...sv}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;
export const IcSearch = () => <svg {...sv}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IcMenu = () => <svg {...sv}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IcToc = () => <svg {...sv}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></svg>;
export const IcGrid = () => <svg {...sv}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>;
export const IcBookmark = ({ on }: { on?: boolean }) => <svg {...sv} fill={on ? "currentColor" : "none"}><path d="M6 3.5h12V21l-6-4.2L6 21z" /></svg>;
export const IcSliders = () => <svg {...sv}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>;
export const IcClose = () => <svg {...sv}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IcDownload = () => <svg {...sv}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>;
export const IcShare = () => <svg {...sv}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></svg>;
export const IcExternal = () => <svg {...sv}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
export const IcSun = () => <svg {...sv}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></svg>;

export const MODES: { id: Mode; label: string; icon: ReactNode }[] = [
  { id: "book", label: "Book", icon: <IcBook /> },
  { id: "slide", label: "Slide", icon: <IcSlide /> },
  { id: "scroll", label: "Scroll", icon: <IcScroll /> },
];

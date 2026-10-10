/**
 * Home Page का डिफ़ॉल्ट डेटा (मूल HTML से)।
 * Phase 2-3 में यही डेटा Supabase (feature_cards, social_links, site_settings)
 * से आएगा और Admin Panel से बदला जा सकेगा। तब तक यह Fallback है।
 */

export type FeatureCardData = {
  key: string;
  title: string;
  description: string;
  /** null = अभी Page नहीं बना → क्लिक पर "जल्द आ रहा है" संदेश */
  href: string | null;
  color: string;
  bg1: string;
  bg2: string;
  icon: string;
};

export type SocialLinkData = {
  key: string;
  name: string;
  action: string;
  subtitle: string;
  href: string | null;
  color: string;
  glow: string;
  border: string;
  bg1: string;
  bg2: string;
  accent: string;
  icon: string;
};

export const HERO = {
  badge: "✦ KRISHNA BLESSINGS • PREMIUM EDIT",
  title: "कान्हा तुम्हारे साथ है • Straight 0°",
  subtitle: "Har task complete = ashirwad +1",
  quote: "“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन”",
  quoteLine2: "मेहनत तुम्हारी, सफलता निश्चित है",
  quoteLine3: "हौसला मत हारो, कान्हा तुम्हारे साथ है!",
};

export const STATUS = {
  line1: ["Best banao, roz jeeto", "Premium Edit", "Jai Shri Krishna"],
  line2: "Premium dark • Gold+Emerald aura • Focus mode • Reset Din",
  tail: "Vardi intezaar kar rahi hai",
};

export const COMMUNITY = {
  titleLead: "Join our",
  titleGold: "Study Community",
  badge: "FREE",
  text: "WhatsApp, Telegram, Instagram aur YouTube par judo — daily updates, PDFs, notes aur doubts.",
};

export const DEFAULT_FEATURE_CARDS: FeatureCardData[] = [
  { key: "free", title: "Free Course", description: "Top quality free courses for you", href: null, color: "#3B82F6", bg1: "#1E293B", bg2: "#0F172A", icon: "/images/tools/free.webp" },
  { key: "books", title: "Books", description: "Best books & resources curated", href: "/books", color: "#F59E0B", bg1: "#422006", bg2: "#1C1917", icon: "/images/tools/books.webp" },
  { key: "mock", title: "Mock Test", description: "Practice with real exam pattern", href: "/mock-tests", color: "#A855F7", bg1: "#2E1065", bg2: "#1E1B4B", icon: "/images/tools/mock.webp" },
  { key: "task", title: "Task", description: "Daily tasks & streak tracker", href: "/tasks", color: "#10B981", bg1: "#022C22", bg2: "#020617", icon: "/images/tools/task.webp" },
  { key: "apps", title: "Premium Apps", description: "Exclusive premium app access", href: null, color: "#8B5CF6", bg1: "#2E1065", bg2: "#1E1B4B", icon: "/images/tools/apps.webp" },
  { key: "exam", title: "Exam Prep", description: "Complete preparation guide", href: null, color: "#EF4444", bg1: "#450A0A", bg2: "#1C1917", icon: "/images/tools/exam.webp" },
  { key: "notes", title: "Notes & PDFs", description: "Handwritten notes & PDFs", href: "/books", color: "#06B6D4", bg1: "#042F2E", bg2: "#020617", icon: "/images/tools/notes.webp" },
  { key: "tips", title: "Study Tips", description: "Smart tips to study better", href: null, color: "#EAB308", bg1: "#422006", bg2: "#1C1917", icon: "/images/tools/tips.webp" },
];

/** अपने असली Links यहाँ (या Phase 3 के बाद Admin Panel में) डालें */
export const DEFAULT_SOCIAL_LINKS: SocialLinkData[] = [
  { key: "wa", name: "WhatsApp", action: "Join Now", subtitle: "Daily updates • Doubts", href: null, color: "#34E39A", glow: "#22C55E", border: "linear-gradient(135deg,#2BF080,#15A34A)", bg1: "#0E6B45", bg2: "#032A1F", accent: "#0F6B4A", icon: "/images/social/wa.webp" },
  { key: "tg", name: "Telegram", action: "Join Now", subtitle: "PDFs • Notes • Tests", href: null, color: "#3DB8FF", glow: "#1E90FF", border: "linear-gradient(135deg,#3AB0FF,#1D6FEB)", bg1: "#0B3F8F", bg2: "#06173A", accent: "#1D4ED8", icon: "/images/social/tg.webp" },
  { key: "ig", name: "Instagram", action: "Follow", subtitle: "Reels • Motivation • Tips", href: null, color: "#FF4FB0", glow: "#C026D3", border: "linear-gradient(90deg,#FF7A1A,#E1306C,#A855F7)", bg1: "#4A1A6B", bg2: "#1B0B2E", accent: "#6D28D9", icon: "/images/social/ig.webp" },
  { key: "yt", name: "YouTube", action: "Subscribe", subtitle: "Free lectures • Live", href: null, color: "#FF3B30", glow: "#EF4444", border: "linear-gradient(135deg,#FF4545,#C81E1E)", bg1: "#6B1212", bg2: "#240505", accent: "#B91C1C", icon: "/images/social/yt.webp" },
];

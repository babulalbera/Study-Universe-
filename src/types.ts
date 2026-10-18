export type VideoType =
  | "youtube"
  | "drive"
  | "mega"
  | "vimeo"
  | "mp4"
  | "direct"
  | "unknown";

export interface Video {
  id: string;
  title: string;
  desc: string;
  link: string;
  type: VideoType;
  embed: string;
  dur: string;
  thumb: string;
}

export interface Course {
  id: string;
  title: string;
  desc: string;
  thumb: string;
  cat: string;
  videos: Video[];
}

export const CATEGORIES = [
  "all",
  "Maths",
  "Reasoning",
  "GS",
  "English",
  "Science",
  "Video Editing",
] as const;

export const SEED_COURSES: Course[] = [
  {
    id: "f1",
    title: "Complete Maths Mastery - SSC CGL 2026",
    desc: "Arithmetic + Advanced Maths with short tricks, PYQ discussion and 100+ mock tests. Premium recorded batch.",
    thumb: "",
    cat: "Maths",
    videos: [
      {
        id: "v1",
        title: "Number System - Foundation + Tricks",
        desc: "Complete number system with divisibility rules and last digit tricks for SSC.",
        link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        type: "youtube",
        embed: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        dur: "2:14:33",
        thumb: "",
      },
      {
        id: "v2",
        title: "Algebra - Formula Booster",
        desc: "All algebra formulas with 50 selected questions.",
        link: "https://drive.google.com/file/d/1abc/view",
        type: "drive",
        embed: "https://drive.google.com/file/d/1abc/preview",
        dur: "1:45:00",
        thumb: "",
      },
      {
        id: "v3",
        title: "Geometry Masterclass Part-1",
        desc: "Triangle, circle properties with visual approach.",
        link: "https://example.com/video.mp4",
        type: "mp4",
        embed: "https://example.com/video.mp4",
        dur: "58:20",
        thumb: "",
      },
    ],
  },
  {
    id: "f2",
    title: "Reasoning Revolution - Zero to Hero",
    desc: "Verbal & non-verbal reasoning with live puzzle sessions and sectional tests.",
    thumb: "",
    cat: "Reasoning",
    videos: [
      {
        id: "v4",
        title: "Syllogism - Reverse Method",
        desc: "Solve any syllogism in 10 seconds.",
        link: "https://vimeo.com/123456",
        type: "vimeo",
        embed: "https://player.vimeo.com/video/123456",
        dur: "42:15",
        thumb: "",
      },
      {
        id: "v5",
        title: "Seating Arrangement Advanced",
        desc: "Circular + linear + floor puzzles.",
        link: "https://mega.nz/file/abc",
        type: "mega",
        embed: "https://mega.nz/file/abc",
        dur: "1:12:05",
        thumb: "",
      },
    ],
  },
  {
    id: "f3",
    title: "General Science + GS Crash Course",
    desc: "Physics, Chemistry, Biology + Polity, History, Geography with mnemonics and maps.",
    thumb: "",
    cat: "GS",
    videos: [
      {
        id: "v6",
        title: "Biology - Cell to System",
        desc: "NCERT based science with diagrams.",
        link: "https://www.youtube.com/watch?v=9bZkp7q19f0",
        type: "youtube",
        embed: "https://www.youtube.com/embed/9bZkp7q19f0",
        dur: "3:05:11",
        thumb: "",
      },
    ],
  },
  {
    id: "f4",
    title: "English Elite - Grammar & Vocab Vault",
    desc: "Spotting errors, cloze test, editorial vocab - all in one place.",
    thumb: "",
    cat: "English",
    videos: [
      {
        id: "v7",
        title: "Tenses in 60 Minutes",
        desc: "Complete tense chart with examples.",
        link: "https://example.com/eng.mp4",
        type: "mp4",
        embed: "https://example.com/eng.mp4",
        dur: "1:02:00",
        thumb: "",
      },
    ],
  },
  {
    id: "f5",
    title: "Video Editing Pro - Premiere + After Effects",
    desc: "Transitions, color grading, motion graphics and YT thumbnail system.",
    thumb: "",
    cat: "Video Editing",
    videos: [
      {
        id: "v8",
        title: "Premiere Pro - Cuts & Timeline",
        desc: "J-cut, L-cut, speed ramp workflow.",
        link: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        type: "youtube",
        embed: "https://www.youtube.com/embed/jNQXAC9IVRw",
        dur: "45:30",
        thumb: "",
      },
    ],
  },
  {
    id: "f6",
    title: "Science Lab - Experiments & Concepts",
    desc: "Practical science with lab experiments for visual learners.",
    thumb: "",
    cat: "Science",
    videos: [
      {
        id: "v9",
        title: "Electrolysis & Chemical Reactions",
        desc: "Live lab session recorded.",
        link: "https://drive.google.com/file/d/xyz",
        type: "drive",
        embed: "https://drive.google.com/file/d/xyz/preview",
        dur: "38:12",
        thumb: "",
      },
    ],
  },
];

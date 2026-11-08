// Website ki pehchan: Google, WhatsApp, Facebook sab yahin se naam/link/description lete hain.
// Apna domain lagao to Vercel > Settings > Environment Variables me NEXT_PUBLIC_SITE_URL daalo (jaise https://studyuniverse.in).
const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://studyuniverse.vercel.app";

export const SITE = {
  url: raw.replace(/\/+$/, ""),
  name: "Study Universe",
  title: "Study Universe – SSC CGL Free Mock Test, Books & Courses",
  description:
    "Study Universe par SSC CGL aur dusri exams ke liye free mock tests, books, PDFs, daily tasks aur video courses. Padhai karo, progress track karo, aage badho.",
  keywords: [
    "Study Universe",
    "SSC CGL",
    "SSC CGL mock test",
    "SSC CGL free mock test",
    "SSC CGL PYQ",
    "SSC CGL books PDF",
    "free study material",
    "video courses",
    "daily study tasks",
    "Hindi study app",
  ],
  // Google Search Console ka "HTML tag" wala code (sirf content="...") yahan env me daalna hai
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
} as const;

import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk, Noto_Sans_Devanagari, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomBar from "@/components/layout/BottomBar";
import BackgroundFX from "@/components/layout/BackgroundFX";
import KrishnaFrame from "@/components/layout/KrishnaFrame";
import { getSiteSettings } from "@/features/home/queries";
import { ToastProvider } from "@/components/ui/Toast";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-outfit", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space", display: "swap" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], weight: ["400", "600", "700"], variable: "--font-deva", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Study Universe – Learn • Grow • Achieve", template: "%s | Study Universe" },
  description: "SSC CGL aur dusri exams ke liye free tasks, books, PDFs aur mock tests.",
};

export const viewport: Viewport = { themeColor: "#020603", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const courseHref = settings.course_url || "/courses"; // Admin ne bahari Link diya ho to wahi, warna apna /courses page
  return (
    <html lang="hi" suppressHydrationWarning className={`${outfit.variable} ${space.variable} ${deva.variable} ${serif.variable}`}>
      <head>
        {/* Page dikhne se pehle chuna hua rang laga do — flash nahi hoga */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('su-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>
        <ToastProvider>
          <div className="bg" aria-hidden="true" />
          <BackgroundFX />
          {/* ThemeDock ab Header ke andar hai (profile icon ke paas) */}
          <Header />
          <div className="wrap">
            <main><KrishnaFrame>{children}</KrishnaFrame></main>
            <Footer />
          </div>
          <BottomBar courseHref={courseHref} />
        </ToastProvider>
      </body>
    </html>
  );
}

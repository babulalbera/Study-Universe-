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
import { SITE } from "@/lib/site";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-outfit", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space", display: "swap" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], weight: ["400", "600", "700"], variable: "--font-deva", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

// SEO: Google search, WhatsApp/Facebook link preview aur Twitter card sab yahin se banta hai.
// Har page ka apna title "%s | Study Universe" ban jata hai, aur canonical "./" har page ka apna sahi link deta hai.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: SITE.name, locale: "hi_IN", title: SITE.title, description: SITE.description },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  ...(SITE.googleVerification ? { verification: { google: SITE.googleVerification } } : {}),
};

export const viewport: Viewport = { themeColor: "#020603", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const courseHref = settings.course_url || "/courses"; // Admin ne bahari Link diya ho to wahi, warna apna /courses page
  return (
    <html lang="hi" suppressHydrationWarning className={`${outfit.variable} ${space.variable} ${deva.variable} ${serif.variable}`}>
      <head>
        {/* Page dikhne se pehle chuna hua rang laga do — flash nahi hoga */}
        <script dangerouslySetInnerHTML={{ __html: "try{var d=document.documentElement,t=localStorage.getItem('su-theme');if(t)d.dataset.theme=t;var v=localStorage.getItem('su-vars');if(v){var o=JSON.parse(v);for(var k in o)if(k.slice(0,2)==='--')d.style.setProperty(k,o[k])}}catch(e){}" }} />
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

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomBar from "@/components/layout/BottomBar";
import BackgroundFX from "@/components/layout/BackgroundFX";
import KrishnaFrame from "@/components/layout/KrishnaFrame";
import { getSiteSettings } from "@/features/home/queries";
import { ToastProvider } from "@/components/ui/Toast";
import { SITE } from "@/lib/site";

const outfit = localFont({
  src: [
    { path: "./fonts/outfit/400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/outfit/600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/outfit/700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});
const space = localFont({
  src: [
    { path: "./fonts/space-grotesk/500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk/700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space",
  display: "swap",
});
const deva = localFont({
  src: [
    { path: "./fonts/deva/400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/deva/600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/deva/700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-deva",
  display: "swap",
});
const serif = localFont({
  src: [
    { path: "./fonts/serif/500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/serif/500italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/serif/600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/serif/600italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/serif/700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/serif/700italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

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
  const courseHref = settings.course_url || "/courses";
  return (
    <html lang="hi" suppressHydrationWarning className={`${outfit.variable} ${space.variable} ${deva.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var d=document.documentElement,t=localStorage.getItem('su-theme');if(t)d.dataset.theme=t;var v=localStorage.getItem('su-vars');if(v){var o=JSON.parse(v);for(var k in o)if(k.slice(0,2)==='--')d.style.setProperty(k,o[k])}}catch(e){}" }} />
      </head>
      <body>
        <ToastProvider>
          <div className="bg" aria-hidden="true" />
          <BackgroundFX />
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

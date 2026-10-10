import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { ToastProvider } from "@/components/ui/Toast";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-outfit", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space", display: "swap" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], weight: ["400", "600", "700"], variable: "--font-deva", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Study Universe – Learn • Grow • Achieve", template: "%s | Study Universe" },
  description: "SSC CGL aur dusri exams ke liye free tasks, books, PDFs aur mock tests.",
};

export const viewport: Viewport = { themeColor: "#020603", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${outfit.variable} ${space.variable} ${deva.variable}`}>
      <body>
        <ToastProvider>
          <div className="bg" aria-hidden="true" />
          <Header />
          <div className="wrap">
            <main>{children}</main>
            <Footer />
          </div>
          <MobileNavigation />
        </ToastProvider>
      </body>
    </html>
  );
}

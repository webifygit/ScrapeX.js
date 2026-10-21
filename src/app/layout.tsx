import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Syne } from "next/font/google";
import { FaviconSpin } from "@/components/site/FaviconSpin";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jakarta", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

// Bump when the icon files change so browsers drop cached copies.
const ICON_VERSION = "2";

const description = "Custom web scrapers that collect, check and deliver public web data on your schedule.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.scrapex.site"),
  title: "ScrapeX — Web data, ready to use",
  description,
  openGraph: { title: "ScrapeX", description, type: "website" },
  twitter: { card: "summary_large_image" },
  // ICO first with explicit sizes so Chrome prefers the SVG; FaviconSpin animates the SVG one.
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "32x32" },
      { url: `/icon.svg?v=${ICON_VERSION}`, type: "image/svg+xml" },
    ],
    apple: { url: `/apple-touch-icon.png?v=${ICON_VERSION}`, sizes: "180x180" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${syne.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <FaviconSpin />
      </body>
    </html>
  );
}

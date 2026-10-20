import type { Metadata } from "next";
import Home from "@/components/site/Home";

export const metadata: Metadata = {
  title: "ScrapeX — Any website. Your data. Ready to use.",
  description: "ScrapeX builds custom web scrapers that collect public web data, check it, and deliver it as a spreadsheet, data feed or CRM import on your schedule.",
  openGraph: {
    title: "ScrapeX — Any website. Your data. Ready to use.",
    description: "Custom web scrapers, cleaned data, delivered your way. Public data only, every record linked to its source.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <Home />;
}

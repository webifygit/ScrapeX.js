import type { Metadata } from "next";
import { Button, Card, PageHero, Reveal, Section } from "@/components/site/Layout";

export const metadata: Metadata = {
  title: "Services — ScrapeX",
  description: "Lead and contact data, price monitoring, listings, market research, ongoing data feeds, and cleaning and delivery from ScrapeX.",
  openGraph: {
    title: "Services — ScrapeX",
    description: "Custom scrapers for leads, prices, listings and research, cleaned and delivered your way.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const items: [string, string, string[]][] = [
  ["Lead and contact data", "Build prospect lists from public directories, team pages and organization websites.", ["Names and roles", "Work emails and office phones", "Confirmed or inferred on every email"]],
  ["Price and product monitoring", "Watch competitor stores and marketplaces so you never miss a price change.", ["Prices and discounts", "Stock status", "Product details and reviews"]],
  ["Listings and directories", "Turn property, job, business and marketplace listings into one clean table.", ["New and removed listings", "Price changes", "Contact and location details"]],
  ["Market and competitor research", "Collect the public facts behind market sizing, benchmarking and tracking.", ["Company and product data", "Category coverage", "Trend snapshots over time"]],
  ["Ongoing data feeds", "Your scraper keeps running on a schedule, with every change flagged.", ["Daily, weekly or monthly", "New, updated and removed records", "Alerts when sites change"]],
  ["Cleaning and delivery", "Data that's ready to use the moment it lands.", ["De-duplicated and checked", "Your categories and fields", "Excel, CSV, Google Sheets, feed or CRM"]],
];

export default function Services() {
  return (
    <>
      <PageHero label="Services" title="Data, collected for you." sub="Tell us what data you need and which websites it lives on. We build the scraper, check the results and deliver them your way." />
      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(([t, d, pts], i) => (
            <Reveal key={t} delay={(i % 2) * 0.08}>
              <Card>
                <span className="font-mono text-sm">0{i + 1}</span>
                <h2 className="mt-2 text-2xl font-semibold">{t}</h2>
                <p className="mt-2 text-muted-foreground">{d}</p>
                <ul className="mt-4 space-y-1.5 text-sm">{pts.map((p) => <li key={p} className="flex gap-2"><span className="text-confirmed">✓</span>{p}</li>)}</ul>
              </Card>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-14 flex flex-col items-start gap-4 rounded-3xl border p-6 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-semibold">Need something not listed? If it&apos;s on a public website, we can likely collect it.</p>
          <Button href="/quote">Get a quote</Button>
        </Reveal>
      </Section>
    </>
  );
}

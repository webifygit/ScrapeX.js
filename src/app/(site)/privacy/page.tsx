import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Layout";

export const metadata: Metadata = {
  title: "Privacy policy — ScrapeX",
  description: "How ScrapeX handles publicly available web data and information from our customers.",
  openGraph: {
    title: "Privacy policy — ScrapeX",
    description: "How ScrapeX handles publicly available web data.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const sections = [
  ["What we collect", "Only publicly available data from the websites our clients choose, collected under each site's rules, with every record linked to the page it came from. From customers: account and contact details you give us."],
  ["What we don't collect", "Home addresses, personal phone numbers, personal email accounts, social profiles or anything behind a login."],
  ["How it's used", "To deliver the datasets our clients request, as spreadsheets, data feeds or CRM imports."],
  ["Removal", "Anyone can request removal through our Remove my information page. We delete the record and keep an opt-out entry so it isn't re-added."],
  ["Contact", "Questions about privacy: hello@scrapex.site."],
];

export default function Privacy() {
  return (
    <>
      <PageHero label="Legal" title="Privacy policy" sub="Draft summary. Have this reviewed by your legal advisor before launch." />
      <Section>
        <div className="max-w-3xl space-y-10">
          {sections.map(([h, p]) => <div key={h}><h2 className="text-2xl font-semibold">{h}</h2><p className="mt-3 text-muted-foreground">{p}</p></div>)}
        </div>
      </Section>
    </>
  );
}

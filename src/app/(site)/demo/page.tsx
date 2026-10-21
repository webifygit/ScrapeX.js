import type { Metadata } from "next";
import { Card, Icon, PageHero, Reveal, Section } from "@/components/site/Layout";
import { LiveDemo } from "@/components/site/LiveDemo";
import { DEMO_PAGE_LIMIT } from "@/lib/demo/schema";

export const metadata: Metadata = {
  title: "Live demo — ScrapeX",
  description: `Point ScrapeX at a public page and watch it pull the data out, live. Verify your company email and the demo scrapes up to ${DEMO_PAGE_LIMIT} pages, then hands you the spreadsheet.`,
  openGraph: {
    title: "Live demo — ScrapeX",
    description: "Watch ScrapeX pull data off a real page, then download the spreadsheet.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const facts = [
  {
    t: `${DEMO_PAGE_LIMIT} pages, then it stops`,
    d: "The demo follows links from your page and stops at the limit. The real thing has no limit.",
    i: "M4 7h16M4 12h10M4 17h7",
  },
  {
    t: "robots.txt comes first",
    d: "We read the site's rules before the first request and skip whatever it disallows.",
    i: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  },
  {
    t: "Public pages only",
    d: "No logins, no paywalls, no private data. Same rule as every ScrapeX job.",
    i: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  },
  {
    t: "Your data, downloadable",
    d: "Excel, CSV, JSON or Markdown the moment the run finishes.",
    i: "M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6",
  },
];

export default function Demo() {
  return (
    <>
      <PageHero
        label="Live demo"
        title="Watch it scrape a real page."
        sub={`Give us a public URL and your company email. Verify the code we send, and ScrapeX pulls the data off up to ${DEMO_PAGE_LIMIT} pages while you watch — then hands you the spreadsheet.`}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <LiveDemo />
          <div className="space-y-4">
            <Reveal>
              <p className="label-mono text-muted-foreground">What this demo does</p>
            </Reveal>
            {facts.map((fact, index) => (
              <Reveal key={fact.t} delay={index * 0.05}>
                <Card>
                  <Icon d={fact.i} className="text-foreground" />
                  <p className="mt-3 font-semibold">{fact.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fact.d}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

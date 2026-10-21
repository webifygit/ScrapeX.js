import type { Metadata } from "next";
import { Card, Icon, PageHero, Reveal, Section } from "@/components/site/Layout";
import { LiveDemo } from "@/components/site/LiveDemo";
import { DEMO_CONTACT_LIMIT } from "@/lib/demo/schema";

export const metadata: Metadata = {
  title: "Live demo — ScrapeX",
  description: `Point ScrapeX at a public website and watch it pull out contact details, live. Verify your company email and the demo collects up to ${DEMO_CONTACT_LIMIT} contacts, then hands you the spreadsheet.`,
  openGraph: {
    title: "Live demo — ScrapeX",
    description:
      "Watch ScrapeX pull contact details off a real website, then download the spreadsheet.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const facts = [
  {
    t: `${DEMO_CONTACT_LIMIT} contacts, then it stops`,
    d: "It keeps reading pages until it has that many emails and phone numbers. The real thing has no limit.",
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
    d: "Every contact with the page it came from, as Excel, CSV, JSON or Markdown.",
    i: "M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6",
  },
];

export default function Demo() {
  return (
    <>
      <PageHero
        label="Live demo"
        title="Watch it find real contacts."
        sub={`Give us a public website and your company email. Verify the code we send, and ScrapeX reads the site until it has ${DEMO_CONTACT_LIMIT} contact details — then hands you the spreadsheet.`}
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

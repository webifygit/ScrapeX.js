import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Layout";

export const metadata: Metadata = {
  title: "Terms of service — ScrapeX",
  description: "The terms that apply to using ScrapeX custom web scraping and data delivery.",
  openGraph: {
    title: "Terms of service — ScrapeX",
    description: "The terms for using ScrapeX.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const sections = [
  ["Using ScrapeX", "ScrapeX builds custom scrapers for the public websites you choose and delivers the results in the format and schedule you agree with us. You use the data lawfully and in line with each source's rules."],
  ["Your responsibilities", "Follow applicable email and privacy laws, honor unsubscribe requests, and verify inferred emails before sending."],
  ["Accounts", "Keep team logins secure. You're responsible for activity under your account."],
  ["Data accuracy", "We work to keep data current, but websites change. Confidence labels on each record show our confidence, not a guarantee."],
  ["Contact", "Questions about these terms: hello@scrapex.site."],
];

export default function Terms() {
  return (
    <>
      <PageHero label="Legal" title="Terms of service" sub="Draft summary. Have this reviewed by your legal advisor before launch." />
      <Section>
        <div className="max-w-3xl space-y-10">
          {sections.map(([h, p]) => <div key={h}><h2 className="text-2xl font-semibold">{h}</h2><p className="mt-3 text-muted-foreground">{p}</p></div>)}
        </div>
      </Section>
    </>
  );
}

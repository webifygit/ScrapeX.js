import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Layout";
import { QuoteForm } from "@/components/site/QuoteForm";

export const metadata: Metadata = {
  title: "Get a quote — ScrapeX",
  description: "Tell ScrapeX what data you need and which websites it lives on. We'll reply with a plan and a quote.",
  openGraph: {
    title: "Get a quote — ScrapeX",
    description: "Tell us what data you need. We'll reply with a plan and a quote.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Quote() {
  return (
    <>
      <PageHero label="Get a quote" title="Tell us what data you need." sub="We'll reply with a plan and a quote." />
      <Section>
        <div className="max-w-2xl">
          <QuoteForm />
        </div>
      </Section>
    </>
  );
}

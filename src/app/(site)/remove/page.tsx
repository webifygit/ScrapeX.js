import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Layout";
import { RemoveForm } from "@/components/site/RemoveForm";

export const metadata: Metadata = {
  title: "Remove my information — ScrapeX",
  description: "Listed in ScrapeX? Request removal of your details and we'll add you to our opt-out list.",
  openGraph: {
    title: "Remove my information — ScrapeX",
    description: "Request removal of your details from ScrapeX.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function Remove() {
  return (
    <>
      <PageHero label="Opt out" title="Remove my information." sub="We'll delete your details from our data and keep you on our opt-out list so you aren't added again." />
      <Section>
        <div className="max-w-2xl">
          <RemoveForm />
        </div>
      </Section>
    </>
  );
}

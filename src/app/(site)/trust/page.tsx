import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, PageHero, Reveal, Section } from "@/components/site/Layout";

export const metadata: Metadata = {
  title: "Trust and data practices — ScrapeX",
  description: "How ScrapeX collects public web data responsibly: public data only, each site's rules followed, sources shown and easy removal.",
  openGraph: {
    title: "Trust and data practices — ScrapeX",
    description: "Public data only. Gentle on servers. Every source shown. Easy removal.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const items = [
  ["Public data only", "We collect only publicly available data. We never log in, bypass access controls or buy lists."],
  ["Follows each site's rules", "We respect each site's crawling rules and stop reading any page a site asks us not to."],
  ["Gentle on servers", "Requests are slow, spaced out and run off-peak so websites are never strained."],
  ["No sensitive personal data", "For contact data we collect published work details only. Never home addresses, personal phones or private profiles."],
  ["Every source shown", "Each record links back to the exact page it came from, so you can check it yourself."],
  ["Easy removal", "Anyone listed can ask to be removed. We delete their details and keep them on an opt-out list."],
];

export default function Trust() {
  return (
    <>
      <PageHero label="Trust" title="Public data, collected politely." sub="ScrapeX collects only publicly available data, follows each site's rules, and links every record to the page it came from." />
      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 2) * 0.08}><Card><h2 className="text-xl font-semibold">{t}</h2><p className="mt-2 text-muted-foreground">{d}</p></Card></Reveal>
          ))}
        </div>
        <Reveal className="mt-14 grid gap-4 md:grid-cols-2">
          <Card><Badge status="Confirmed" /><p className="mt-3">Published on the source page, ready to use.</p></Card>
          <Card><Badge status="Inferred" /><p className="mt-3">Derived from patterns on the source; verify before you use it.</p></Card>
        </Reveal>
        <p className="mt-10 text-muted-foreground">Listed and want out? <Link href="/remove" className="font-semibold text-foreground underline decoration-lime decoration-4 underline-offset-4">Remove my information</Link></p>
      </Section>
    </>
  );
}

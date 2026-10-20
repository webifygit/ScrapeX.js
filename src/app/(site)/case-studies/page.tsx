import type { Metadata } from "next";
import { Button, Card, PageHero, Reveal, Section } from "@/components/site/Layout";
import { AppMock } from "@/components/site/Mocks";
import { campuses } from "@/components/site/sample-data";

export const metadata: Metadata = {
  title: "Case study: 600+ university buyers — ScrapeX",
  description: "How ScrapeX mapped 600+ classroom and event technology buyers at 50 SUNY and CUNY campuses for an AV integration company.",
  openGraph: {
    title: "Case study: 600+ university buyers — ScrapeX",
    description: "50 campuses, 600+ decision-makers, 500+ confirmed emails, 400+ office phone numbers.",
    type: "article",
  },
  twitter: { card: "summary_large_image" },
};

const nums = [["50", "campuses"], ["600+", "decision-makers"], ["500+", "confirmed emails"], ["400+", "office phone numbers"]];
const story = [
  ["The challenge", "An AV integration company needed the people who buy classroom and event technology across SUNY and CUNY. Staff directories were scattered across dozens of sites, and many emails were hidden behind scripts or spelled out."],
  ["What we built", "A custom scraper that read each campus's public directories and department pages, found hidden emails, and tagged every contact by buying team: IT, facilities, procurement, event spaces and space management."],
  ["What they got", "One searchable dataset with confirmed or inferred labels on every email, the source page for every record, and a regular refresh that flags new and departed staff."],
];

export default function CaseStudies() {
  return (
    <>
      <PageHero label="Case study" title="600+ university buyers, found and checked." sub="For an AV integration company, ScrapeX mapped the people who buy classroom and event technology at 50 SUNY and CUNY campuses." />
      <section className="border-b bg-card px-4 py-10">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
          {nums.map(([n, l], i) => (
            <Reveal key={l} delay={i * 0.08}><dt className="sr-only">{l}</dt><dd className="font-display text-4xl font-bold md:text-5xl">{n}</dd><dd className="mt-1 text-sm text-muted-foreground">{l}</dd></Reveal>
          ))}
        </dl>
      </section>
      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {story.map(([t, d], i) => <Reveal key={t} delay={i * 0.08}><Card><h2 className="text-xl font-semibold">{t}</h2><p className="mt-2 text-muted-foreground">{d}</p></Card></Reveal>)}
        </div>
        <Reveal className="mt-14"><AppMock /></Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {(Object.keys(campuses) as (keyof typeof campuses)[]).map((sys) => (
            <Reveal key={sys}>
              <h2 className="text-2xl font-bold">{sys} <span className="font-mono text-base">{campuses[sys].length}</span></h2>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">{campuses[sys].map((c) => <li key={c} className="rounded-lg border bg-card px-3 py-2 text-sm">{c}</li>)}</ul>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-14 flex flex-col items-start gap-4 rounded-3xl border p-6 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-semibold">Have a list you wish existed? Tell us what data you need.</p>
          <Button href="/quote">Get a quote</Button>
        </Reveal>
      </Section>
    </>
  );
}

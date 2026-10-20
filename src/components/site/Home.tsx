"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button, Card, Icon, Reveal, Section, SectionHead } from "@/components/site/Layout";
import { HeroPreview } from "@/components/site/Mocks";
import { ServiceViz, StepsTrack, WhyViz, LiveIcon, TeamViz } from "@/components/site/Motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const I = {
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  check: "M5 12l5 5L20 7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  file: "M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6",
  refresh: "M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4",
  plus: "M12 5v14M5 12h14",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  text: "M4 7h16M4 12h10M4 17h7",
  card: "M3 5h18v14H3zM7 9h4M7 13h10",
  form: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h4",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  leaf: "M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  building: "M4 21V5l8-2v18M12 7l8 2v12M8 9v.01M8 13v.01M8 17v.01M16 13v.01M16 17v.01",
  wrench: "M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 1-2-2z",
  cart: "M3 4h2l2 12h11l2-8H6M9 20h.01M17 20h.01",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  megaphone: "M3 10v4h4l6 4V6L7 10zM17 9a4 4 0 0 1 0 6",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3",
  home: "M3 11l9-8 9 8M5 9v12h14V9",
  tag: "M3 3h8l10 10-8 8L3 11zM7 7h.01",
  zap: "M13 2 4 14h7l-1 8 9-12h-7z",
};

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="grid-bg px-4 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="label-mono inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-lime ring-1 ring-ink" /> Custom web scraping</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl">Any website. <span className="inline-block -rotate-2 rounded-2xl border-2 border-ink bg-lime px-3">Your data.</span> Ready to use.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">ScrapeX builds custom web scrapers that collect the data you need from public websites, check it, and deliver it as a spreadsheet, data feed or CRM import, refreshed on your schedule.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/quote" variant="orange">Get a quote</Button>
            <a href="#how" className="inline-flex items-center rounded-full border border-ink px-6 py-3 text-sm font-semibold hover:shadow-[4px_4px_0_var(--navy)]">See how it works</a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Public data only. Every record linked to its source.</p>
        </motion.div>
        <HeroPreview />
      </div>
    </section>
  );
}

const promise = [["Public data only", I.eye], ["Delivered your way", I.file], ["Refreshed on your schedule", I.refresh]] as const;

const services = [
  { t: "Lead and contact data", d: "Names, roles, work emails and office phones from public directories and team pages.", i: I.users },
  { t: "Price and product monitoring", d: "Track prices, stock and product details across online stores.", i: I.tag },
  { t: "Listings and directories", d: "Property, job, business and marketplace listings in one clean table.", i: I.grid },
  { t: "Market and competitor research", d: "Collect the facts behind your market sizing and competitor tracking.", i: I.chart },
  { t: "Ongoing data feeds", d: "Your scraper keeps running daily, weekly or monthly, with changes flagged.", i: I.refresh },
  { t: "Cleaning and delivery", d: "De-duplicated, checked and formatted, then sent where your team works.", i: I.check },
];

const steps = [
  { t: "Tell us what you need", d: "The data you want and the websites it lives on." },
  { t: "We build your scraper", d: "A custom scraper made for exactly those sites." },
  { t: "We check and clean it", d: "Duplicates removed, fields checked, every record linked to its source." },
  { t: "You get your data", d: "Excel, CSV, Google Sheets, a data feed or your CRM, on your schedule." },
];

const why = [
  { t: "Handles hard sites", d: "Scripts, pagination, hidden text and awkward layouts.", i: I.code },
  { t: "Your categories", d: "Records sorted and tagged the way your team thinks.", i: I.grid },
  { t: "Confidence on every record", d: "Each row marked confirmed or inferred.", i: I.check },
  { t: "Source for every record", d: "A link back to the exact page it came from.", i: I.link },
  { t: "Change tracking", d: "See what's new, updated or gone since last run.", i: I.refresh },
  { t: "Your format", d: "Excel, CSV, Google Sheets, data feed or CRM import.", i: I.file },
  { t: "Your own dashboard", d: "Search, filter and download your data anytime.", i: I.search },
  { t: "Opt-outs respected", d: "Removal requests are honored on every run.", i: I.shield },
];

const caseNums = [["50", "campuses"], ["600+", "decision-makers"], ["500+", "confirmed emails"], ["400+", "office phone numbers"]];

const audiences = [
  { t: "Sales and business development", d: "Targeted lead lists built from the sites your buyers use.", i: I.users },
  { t: "E-commerce and retail", d: "Prices, stock and assortments across competitors.", i: I.cart },
  { t: "Real estate", d: "New listings, price changes and agent details.", i: I.home },
  { t: "Recruiting and HR", d: "Job postings and hiring signals across job boards.", i: I.card },
  { t: "Market research and analysts", d: "Clean datasets ready for your models and reports.", i: I.chart },
  { t: "Agencies and startups", d: "Data for clients and products, without building a scraping team.", i: I.zap },
];

const polite = [
  { t: "Public data only", d: "Nothing behind a login.", i: I.eye },
  { t: "Follows each site's rules", d: "We respect each site's crawling rules.", i: I.shield },
  { t: "Gentle on servers", d: "Slow, spaced-out requests.", i: I.leaf },
  { t: "Every source shown", d: "Each record links to its page.", i: I.link },
  { t: "Easy removal", d: "Anyone listed can ask to be removed.", i: I.trash },
];

const faqs: [string, string][] = [
  ["Is web scraping legal?", "Collecting publicly available data is generally lawful, and we only collect public data, follow each site's rules and honor removal requests. Your own use of the data must also follow the laws that apply to you."],
  ["Which websites can you scrape?", "Most public websites: stores, directories, listing sites, job boards and organization pages. We don't collect anything behind a login."],
  ["How do you deliver the data?", "As Excel, CSV, Google Sheets, a data feed, or a direct import into your CRM."],
  ["How often can it be refreshed?", "One-off, daily, weekly or monthly. Recurring runs flag what's new, updated or removed."],
  ["How accurate is the data?", "Every record is checked and cleaned, marked confirmed or inferred, and linked to the page it came from so you can verify it."],
  ["How much does it cost?", "It depends on the sites, volume and refresh schedule. Tell us what you need and we'll reply with a plan and a quote."],
  ["I found my details in your data; can I be removed?", "Yes. Use the Remove my information form and we'll delete your details and keep you on our opt-out list."],
];

export default function Home() {
  return (
    <>
      <Hero />

      <section className="border-y bg-card px-4 py-8" aria-label="Our promise">
        <ul className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {promise.map(([t, i], n) => (
            <Reveal key={t} delay={n * 0.08}><li className="flex items-center gap-3 font-display text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-lime text-ink"><Icon d={i} className="h-5 w-5" /></span>{t}</li></Reveal>
          ))}
        </ul>
      </section>

      <Section id="services">
        <SectionHead label="Services" title="Data, collected for you" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((p, i) => (
            <Reveal key={p.t} delay={(i % 3) * 0.08}><Card className="group"><div className="flex items-center justify-between"><motion.span whileHover={{ rotate: 12, scale: 1.1 }} className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink bg-card transition-colors group-hover:bg-lime"><Icon d={p.i} className="text-foreground" /></motion.span><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span></div><div className="mt-5"><ServiceViz kind={i} /></div><h3 className="mt-5 text-xl font-semibold">{p.t}</h3><p className="mt-2 text-muted-foreground">{p.d}</p></Card></Reveal>
          ))}
        </div>
      </Section>

      <Section id="how" className="pt-0 md:pt-0">
        <SectionHead label="How it works" title="From website to spreadsheet in four steps" />
        <StepsTrack />
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={0.3 + i * 0.4}>
              <li className="group h-full rounded-3xl border bg-card p-5 transition-all hover:-translate-y-1.5 hover:-rotate-[0.6deg]">
                <span className="inline-grid h-9 w-9 place-items-center rounded-full border-2 border-ink font-mono text-sm font-bold transition-colors group-hover:bg-lime">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section className="pt-0 md:pt-0">
        <SectionHead label="Why ScrapeX" title="Built for the sites other tools can't read" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((f, i) => (
            <Reveal key={f.t} delay={(i % 4) * 0.06}><Card className="group"><motion.span whileHover={{ rotate: -12, scale: 1.1 }} className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-card transition-colors group-hover:bg-lime"><Icon d={f.i} className="text-foreground" /></motion.span><div className="mt-4"><WhyViz kind={i} /></div><h3 className="mt-4 font-semibold">{f.t}</h3><p className="mt-2 text-sm text-muted-foreground">{f.d}</p></Card></Reveal>
          ))}
        </div>
      </Section>

      <Section navy>
        <SectionHead navy label="Featured case study" title="600+ university buyers, found and checked" sub="For an AV integration company, ScrapeX mapped the people who buy classroom and event technology at 50 SUNY and CUNY campuses." />
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {caseNums.map(([n, l], i) => (
            <Reveal key={l} delay={i * 0.08}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-5xl font-bold text-orange md:text-6xl">{n}</dd>
              <dd className="mt-1 text-sm text-navy-muted">{l}</dd>
            </Reveal>
          ))}
        </dl>
        <Reveal className="mt-10"><Link href="/case-studies" className="font-semibold underline decoration-lime decoration-4 underline-offset-4">Read the case study →</Link></Reveal>
      </Section>

      <Section>
        <SectionHead label="Who it's for" title="Made for teams that run on data" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a, i) => (
            <Reveal key={a.t} delay={(i % 3) * 0.06}><Card className="group"><LiveIcon i={i}><Icon d={a.i} className="text-foreground" /></LiveIcon><div className="mt-4"><TeamViz kind={i} /></div><h3 className="mt-4 font-semibold">{a.t}</h3><p className="mt-2 text-sm text-muted-foreground">{a.d}</p></Card></Reveal>
          ))}
        </div>
      </Section>

      <Section className="pt-0 md:pt-0">
        <SectionHead label="Trust" title="Public data, collected politely" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {polite.map((r, i) => (
            <Reveal key={r.t} delay={i * 0.06}><Card className="group p-5"><LiveIcon i={i} size="h-10 w-10"><Icon d={r.i} className="text-foreground" /></LiveIcon><div className="mt-4"><TeamViz kind={10 + i} /></div><h3 className="mt-4 font-semibold">{r.t}</h3><p className="mt-1 text-sm text-muted-foreground">{r.d}</p></Card></Reveal>
          ))}
        </div>
      </Section>

      <Section id="faq" className="pt-0 md:pt-0">
        <SectionHead label="FAQ" title="Questions, answered" />
        <Accordion type="single" collapsible className="max-w-3xl rounded-3xl border bg-card px-6">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-base font-semibold">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section navy>
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="max-w-xl text-3xl font-bold md:text-5xl">Tell us what data you need</h2>
            <p className="mt-3 text-lg text-navy-muted">We&apos;ll reply with a plan and a quote.</p>
          </div>
          <Button href="/quote" variant="orange">Get a quote</Button>
        </Reveal>
      </Section>
    </>
  );
}

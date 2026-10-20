"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "./Layout";
import { contacts, heroRows } from "./sample-data";

export function HeroPreview() {
  const reduce = useReducedMotion();
  return (
    <div className="space-y-4">
      <div className="rotate-[-1.5deg] rounded-3xl border-2 border-ink bg-card text-card-foreground">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full border border-ink" /><span className="h-2.5 w-2.5 rounded-full border border-ink" /><span className="h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-ink" />
          <span className="ml-2 truncate rounded-full bg-muted px-3 py-0.5 font-mono text-xs text-muted-foreground">example-store.com/catalog?page=3</span>
        </div>
        <div aria-hidden className="space-y-2 p-4 font-mono text-[11px] leading-tight text-muted-foreground">
          <p className="truncate">&lt;div class=&quot;pr_x9&quot;&gt;Wireless Speaker X2 ★★★★☆ (212)&lt;/div&gt;</p>
          <p className="truncate pl-6 line-through opacity-60">SALE!! $149 → $129.00 · ships in 2–3 days · <u>see more</u></p>
          <p className="truncate">3-bed house, Maple St … call for price … $485k … &lt;span&gt;</p>
          <p className="truncate pl-3">j[dot]reyes [at] example [dot] edu · AV Services Mgr</p>
          <p className="truncate opacity-60">Data Analyst — FT — posted 2d ago — Apply › › ›</p>
        </div>
      </div>
      <div className="flex justify-center" aria-hidden>
        <motion.span animate={reduce ? { y: 0 } : { y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-lime text-lg font-bold text-ink">↓</motion.span>
      </div>
      <div className="rounded-3xl border-2 border-ink bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Clean data · 4 sources</p>
          <span className="label-mono text-muted-foreground">Live</span>
        </div>
        <ul className="divide-y">
          {heroRows.map((r, i) => (
            <motion.li key={r.site} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.5, duration: 0.4 }}
              className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-muted-foreground">{r.site}</p>
                <p className="truncate text-sm font-semibold">{r.item}</p>
                <p className="font-mono text-xs">{r.detail}</p>
              </div>
              <Badge status={r.status} />
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AppMock() {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card text-card-foreground shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          Search contacts, titles, campuses
        </div>
        <span className="rounded-lg bg-burnt px-3 py-1.5 text-sm font-semibold text-foreground-foreground">Export to Excel</span>
      </div>
      <div className="grid md:grid-cols-[200px_1fr]">
        <aside className="hidden space-y-5 border-r p-4 text-sm md:block">
          {[
            ["Campus", ["Lakeside State", "Harbor City College"]],
            ["Buyer role", ["IT & Academic Tech", "Facilities", "Procurement", "AV-heavy spaces", "Space Management"]],
            ["Email", ["Confirmed", "Inferred"]],
          ].map(([h, opts]) => (
            <div key={h as string}>
              <p className="label-mono text-muted-foreground">{h as string}</p>
              {(opts as string[]).map((o, i) => (
                <label key={o} className="mt-2 flex items-center gap-2">
                  <span className={`h-3.5 w-3.5 rounded-sm border ${i === 0 ? "border-ink bg-lime" : "border-input"}`} />{o}
                </label>
              ))}
            </div>
          ))}
        </aside>
        <div>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b bg-muted/60">
              <tr className="label-mono text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium">Campus</th><th className="px-4 py-2 font-medium">Email</th><th className="px-4 py-2 font-medium">Phone</th><th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((c) => (
                <tr key={c.email}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.name} {c.tag && <Tag t={c.tag} />}</p>
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                  </td>
                  <td className="px-4 py-3">{c.campus}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3"><Badge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y md:hidden">
            {contacts.map((c) => (
              <li key={c.email} className="space-y-1 p-4 text-sm">
                <p className="font-semibold">{c.name} {c.tag && <Tag t={c.tag} />}</p>
                <p className="text-xs text-muted-foreground">{c.title} · {c.campus}</p>
                <p className="font-mono text-xs">{c.email}</p>
                <p className="font-mono text-xs">{c.phone}</p>
                <Badge status={c.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Tag({ t }: { t: "New" | "Departed" }) {
  return <span className={`ml-1 rounded-md px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase ${t === "New" ? "bg-navy text-navy-foreground" : "bg-muted text-muted-foreground line-through"}`}>{t}</span>;
}

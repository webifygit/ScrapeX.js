"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const loop = (d = 2.4, delay = 0) => ({ duration: d, repeat: Infinity, ease: "easeInOut" as const, delay });

/** Small looping visual per service card, index matches services order. */
export function ServiceViz({ kind }: { kind: number }) {
  const r = useReducedMotion();
  const a = (v: object) => (r ? {} : v);
  const box = "relative h-20 overflow-hidden rounded-2xl border bg-muted/50";
  switch (kind) {
    case 0: // contacts filling in
      return (
        <div className={`${box} space-y-2 p-3`} aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.span className="h-3 w-3 rounded-full border border-ink bg-lime" {...a({ animate: { scale: [0.6, 1, 0.6] }, transition: loop(2, i * 0.3) })} />
              <motion.span className="h-1.5 rounded-full bg-foreground/70" {...a({ animate: { width: ["10%", `${70 - i * 12}%`, "10%"] }, transition: loop(3, i * 0.3) })} style={{ width: "40%" }} />
            </div>
          ))}
        </div>
      );
    case 1: // price ticker
      return (
        <div className={`${box} flex items-center justify-between px-4`} aria-hidden>
          <span className="font-mono text-xs text-muted-foreground">X2 speaker</span>
          <div className="relative h-6 w-20 overflow-hidden text-right font-mono text-lg font-bold">
            <motion.div {...a({ animate: { y: [0, -24, -24, -48, -48, 0] }, transition: { duration: 6, repeat: Infinity, times: [0, 0.1, 0.4, 0.5, 0.9, 1] } })}>
              {["$149", "$129", "$135"].map((p) => <div key={p} className="h-6 leading-6">{p}</div>)}
            </motion.div>
          </div>
          <motion.span className="rounded-md border border-ink bg-lime px-1.5 text-xs font-bold" {...a({ animate: { rotate: [-6, 6, -6] }, transition: loop(1.6) })}>↓</motion.span>
        </div>
      );
    case 2: // grid tiles lighting up
      return (
        <div className={`${box} grid grid-cols-8 gap-1.5 p-3`} aria-hidden>
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.span key={i} className="rounded-md border border-ink/20 bg-card" {...a({ animate: { backgroundColor: ["var(--card)", "var(--color-lime)", "var(--card)"] }, transition: loop(2.4, (i % 8) * 0.15 + Math.floor(i / 8) * 0.6) })} />
          ))}
        </div>
      );
    case 3: // bar chart
      return (
        <div className={`${box} flex items-end gap-2 px-4 pb-3 pt-4`} aria-hidden>
          {[40, 70, 55, 90, 65, 80].map((h, i) => (
            <motion.span key={i} className={`flex-1 rounded-t-md border border-ink ${i === 3 ? "bg-lime" : "bg-card"}`} style={{ height: `${h}%`, transformOrigin: "bottom" }} {...a({ animate: { scaleY: [0.3, 1, 0.3] }, transition: loop(2.6, i * 0.15) })} />
          ))}
        </div>
      );
    case 4: // refresh feed
      return (
        <div className={`${box} flex items-center gap-3 px-4`} aria-hidden>
          <motion.span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-lime text-lg font-bold" {...a({ animate: { rotate: 360 }, transition: { duration: 3, repeat: Infinity, ease: "linear" } })}>↻</motion.span>
          <div className="flex-1 space-y-1.5 overflow-hidden">
            {["daily", "weekly", "monthly"].map((t, i) => (
              <motion.div key={t} className="flex items-center gap-2 font-mono text-[11px]" {...a({ animate: { opacity: [0.3, 1, 0.3], x: [-4, 0, -4] }, transition: loop(2.4, i * 0.8) })}>
                <span className="h-1.5 w-1.5 rounded-full bg-confirmed" />{t} · updated
              </motion.div>
            ))}
          </div>
        </div>
      );
    default: // messy → clean
      return (
        <div className={`${box} flex items-center justify-between px-4`} aria-hidden>
          <div className="space-y-1">
            {[0, 1, 2].map((i) => <motion.span key={i} className="block h-1.5 w-12 rounded-full bg-foreground/40" {...a({ animate: { x: [0, i % 2 ? 6 : -6, 0], rotate: [0, i % 2 ? 8 : -8, 0] }, transition: loop(1.8, i * 0.2) })} />)}
          </div>
          <motion.span className="font-bold" {...a({ animate: { x: [0, 6, 0] }, transition: loop(1.2) })}>→</motion.span>
          <div className="space-y-1">
            {[0, 1, 2].map((i) => <span key={i} className="block h-1.5 w-12 rounded-full bg-ink" />)}
          </div>
          <motion.span className="grid h-7 w-7 place-items-center rounded-full bg-confirmed text-xs font-bold text-foreground-foreground" {...a({ animate: { scale: [0.8, 1.1, 0.8] }, transition: loop(1.8) })}>✓</motion.span>
        </div>
      );
  }
}

/** Steps line that draws across and a dot travelling along it. */
export function StepsTrack() {
  const r = useReducedMotion();
  return (
    <div className="relative mb-6 hidden h-3 md:block" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />
      <motion.div className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink" initial={r ? false : { width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeInOut" }} />
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-ink bg-card" style={{ left: `calc(${i * 25}% + ${i * 4}px)` }}
          initial={r ? false : { scale: 0 }} whileInView={{ scale: 1, backgroundColor: "var(--color-lime)" }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.4, type: "spring" }} />
      ))}
      {!r && (
        <motion.span className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-lime ring-2 ring-ink" animate={{ left: ["0%", "98%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }} />
      )}
    </div>
  );
}

/** Compact looping visual for each "Why ScrapeX" card, index matches order. */
export function WhyViz({ kind }: { kind: number }) {
  const r = useReducedMotion();
  const a = (v: object) => (r ? {} : v);
  const box = "relative flex h-14 items-center gap-2 overflow-hidden rounded-2xl border bg-muted/50 px-3 font-mono text-[11px]";
  const chip = "rounded-md border border-ink px-1.5 py-0.5";
  switch (kind) {
    case 0: // pages flipping
      return (
        <div className={box} aria-hidden>
          {[1, 2, 3, 4, 5].map((n, i) => (
            <motion.span key={n} className={`${chip} bg-card`} {...a({ animate: { backgroundColor: ["var(--card)", "var(--color-lime)", "var(--card)"], y: [0, -3, 0] }, transition: loop(2.5, i * 0.4) })}>{n}</motion.span>
          ))}
          <span className="text-muted-foreground">›</span>
        </div>
      );
    case 1: // tags sorting
      return (
        <div className={box} aria-hidden>
          {["leads", "retail", "jobs"].map((t, i) => (
            <motion.span key={t} className={`${chip} ${i === 0 ? "bg-lime" : "bg-card"}`} {...a({ animate: { x: [0, 8, 0], rotate: [0, i % 2 ? -4 : 4, 0] }, transition: loop(2.2, i * 0.3) })}>{t}</motion.span>
          ))}
        </div>
      );
    case 2: // badges alternating
      return (
        <div className={box} aria-hidden>
          <motion.span className="rounded-md bg-confirmed px-2 py-0.5 font-sans text-xs font-semibold text-foreground-foreground" {...a({ animate: { scale: [1, 1.1, 1] }, transition: loop(1.8) })}>✓ Confirmed</motion.span>
          <motion.span className="rounded-md bg-inferred-tint px-2 py-0.5 font-sans text-xs font-semibold text-inferred ring-1 ring-inferred/30" {...a({ animate: { scale: [1, 1.1, 1] }, transition: loop(1.8, 0.9) })}>~ Inferred</motion.span>
        </div>
      );
    case 3: // link pulse
      return (
        <div className={box} aria-hidden>
          <span className="truncate">record #214</span>
          <div className="relative h-0.5 flex-1 bg-border">
            <motion.span className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-ink" {...a({ animate: { left: ["0%", "95%"] }, transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } })} />
          </div>
          <span className="truncate underline">source</span>
        </div>
      );
    case 4: // change tracking
      return (
        <div className={box} aria-hidden>
          {[["+3 new", "bg-confirmed text-foreground-foreground"], ["~5 upd.", "bg-inferred-tint text-inferred"], ["−1 gone", "bg-card line-through"]].map(([t, c], i) => (
            <motion.span key={t} className={`whitespace-nowrap rounded-md px-1.5 py-0.5 ${c}`} {...a({ animate: { opacity: [0.3, 1, 0.3] }, transition: loop(2.4, i * 0.8) })}>{t}</motion.span>
          ))}
        </div>
      );
    case 5: // format cycling
      return (
        <div className={`${box} justify-center`} aria-hidden>
          <span className="text-muted-foreground">export.</span>
          <div className="relative h-5 w-14 overflow-hidden">
            <motion.div {...a({ animate: { y: [0, -20, -40, -60, 0] }, transition: { duration: 6, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] } })}>
              {["xlsx", "csv", "sheets", "crm"].map((f) => <div key={f} className="h-5 font-bold leading-5">{f}</div>)}
            </motion.div>
          </div>
        </div>
      );
    case 6: // search typing
      return (
        <div className={box} aria-hidden>
          <span>⌕</span>
          <motion.span className="overflow-hidden whitespace-nowrap" style={{ width: "70%" }} {...a({ animate: { width: ["0%", "70%", "70%", "0%"] }, transition: { duration: 4, repeat: Infinity, times: [0, 0.4, 0.8, 1] } })}>price &lt; $150</motion.span>
          <motion.span className="h-3.5 w-px bg-ink" {...a({ animate: { opacity: [1, 0, 1] }, transition: { duration: 0.8, repeat: Infinity } })} />
        </div>
      );
    default: // shield pulse
      return (
        <div className={box} aria-hidden>
          <motion.span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-lime font-bold" {...a({ animate: { scale: [1, 1.12, 1] }, transition: loop(1.6) })}>✓</motion.span>
          <span>opt-out list · honored</span>
        </div>
      );
  }
}

/** Icon badge that floats and pings on a loop; turns lime on card hover. */
export function LiveIcon({ children, i = 0, size = "h-11 w-11" }: { children: ReactNode; i?: number; size?: string }) {
  const r = useReducedMotion();
  return (
    <motion.span className={`relative grid ${size} place-items-center rounded-xl border-2 border-ink bg-card transition-colors group-hover:bg-lime`}
      {...(r ? {} : { animate: { y: [0, -4, 0], rotate: [0, i % 2 ? 6 : -6, 0] }, transition: loop(2.8, i * 0.35) })} whileHover={{ scale: 1.12 }}>
      {!r && <motion.span aria-hidden className="absolute inset-0 rounded-xl border-2 border-lime" animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }} />}
      {children}
    </motion.span>
  );
}

/** Thin bar that streams data along the bottom of a card. */
export function DataStream({ i = 0 }: { i?: number }) {
  const r = useReducedMotion();
  return (
    <div aria-hidden className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
      <motion.span className="absolute inset-y-0 w-1/3 rounded-full bg-lime ring-1 ring-ink/40" initial={{ left: "-35%" }}
        {...(r ? { style: { left: "0%" } } : { animate: { left: ["-35%", "105%"] }, transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 } })} />
    </div>
  );
}

/** Looping mini visual for "Who it's for" (0-5) and trust cards (10-14). */
export function TeamViz({ kind }: { kind: number }) {
  const r = useReducedMotion();
  const a = (v: object) => (r ? {} : v);
  const box = "relative flex h-14 items-center gap-2 overflow-hidden rounded-2xl border bg-muted/50 px-3 font-mono text-[11px]";
  const chip = "whitespace-nowrap rounded-md border border-ink px-1.5 py-0.5";
  const rows = (items: string[], hi = 0) => (
    <div className={box} aria-hidden>
      {items.map((t, i) => (
        <motion.span key={t} className={`${chip} ${i === hi ? "bg-lime" : "bg-card"}`} {...a({ animate: { y: [8, 0, 0, -8], opacity: [0, 1, 1, 0] }, transition: { duration: 3, repeat: Infinity, delay: i * 0.4, times: [0, 0.2, 0.8, 1] } })}>{t}</motion.span>
      ))}
    </div>
  );
  switch (kind) {
    case 0: return rows(["+ lead", "+ lead", "+ lead"]);
    case 1: return (
      <div className={`${box} justify-between`} aria-hidden>
        {["$129", "$135", "$119"].map((p, i) => <motion.span key={p} className={`${chip} bg-card`} {...a({ animate: { backgroundColor: ["var(--card)", "var(--color-lime)", "var(--card)"] }, transition: loop(2.4, i * 0.8) })}>{p}</motion.span>)}
      </div>
    );
    case 2: return (
      <div className={box} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="h-6 w-6 rounded-t-full border border-ink bg-card" style={{ clipPath: "polygon(50% 0,100% 40%,100% 100%,0 100%,0 40%)" }} {...a({ animate: { backgroundColor: ["var(--card)", "var(--color-lime)", "var(--card)"], y: [0, -3, 0] }, transition: loop(2.5, i * 0.3) })} />)}
        <span className="ml-auto">just listed</span>
      </div>
    );
    case 3: return rows(["analyst", "designer", "engineer"], 1);
    case 4: return (
      <div className={`${box} items-end pb-2`} aria-hidden>
        <svg viewBox="0 0 100 30" className="h-10 w-full"><motion.path d="M0 25 L15 18 L30 21 L45 10 L60 14 L75 5 L100 8" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: r ? 1 : 0 }} {...a({ animate: { pathLength: [0, 1, 1] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.7, 1] } })} /></svg>
      </div>
    );
    case 5: return (
      <div className={box} aria-hidden>
        <motion.span className="text-lg" {...a({ animate: { x: [0, 120, 0], rotate: [0, 0, 180] }, transition: loop(3) })}>⚡</motion.span>
        <span className="ml-auto">ship faster</span>
      </div>
    );
    case 10: return (
      <div className={box} aria-hidden>
        <motion.span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-lime" {...a({ animate: { scaleY: [1, 0.1, 1] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.05, 0.1] } })}>●</motion.span>
        <span>public ✓</span><span className="line-through opacity-50">login</span>
      </div>
    );
    case 11: return (
      <div className={box} aria-hidden>
        <span>robots.txt</span>
        <motion.span className="ml-auto rounded-md bg-confirmed px-1.5 py-0.5 font-sans font-semibold text-foreground-foreground" {...a({ animate: { scale: [0.9, 1.1, 0.9] }, transition: loop(1.8) })}>✓ ok</motion.span>
      </div>
    );
    case 12: return (
      <div className={box} aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-ink" {...a({ animate: { opacity: [0.15, 1, 0.15] }, transition: { duration: 3, repeat: Infinity, delay: i * 0.5 } })} />)}
      </div>
    );
    case 13: return (
      <div className={box} aria-hidden>
        <span>row</span>
        <div className="relative h-0.5 flex-1 bg-border"><motion.span className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-ink" {...a({ animate: { left: ["0%", "92%"] }, transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } })} /></div>
        <span className="underline">page</span>
      </div>
    );
    default: return (
      <div className={box} aria-hidden>
        <motion.span className="h-1.5 rounded-full bg-ink" style={{ width: "60%" }} {...a({ animate: { width: ["60%", "0%", "0%", "60%"], opacity: [1, 0, 0, 1] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.4, 0.8, 1] } })} />
        <span className="ml-auto">removed</span>
      </div>
    );
  }
}

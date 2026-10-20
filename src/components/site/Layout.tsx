"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 300, damping: 28 });
  const sy = useSpring(y, { stiffness: 300, damping: 28 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX); y.set(e.clientY);
      setBig(!!(e.target as HTMLElement).closest("a,button,input,textarea,select"));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] hidden rounded-full bg-lime mix-blend-multiply md:block"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }} animate={{ width: big ? 48 : 14, height: big ? 48 : 14 }} />
  );
}

export function Wordmark({ onNavy = false }: { onNavy?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-display text-xl font-extrabold">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${onNavy ? "bg-lime text-ink" : "bg-ink text-lime"}`}>
        <motion.span animate={{ rotate: [0, 90, 90, 180, 180] }} transition={{ duration: 4, repeat: Infinity }}>✕</motion.span>
      </span>
      ScrapeX
    </span>
  );
}

const navLinks: { label: string; href: string }[] = [
  { label: "Services", href: "/services" },
  { label: "How it works", href: "/#how" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Trust", href: "/trust" },
  { label: "FAQ", href: "/#faq" },
];

function NavItem({ item, className, onClick }: { item: (typeof navLinks)[number]; className: string; onClick?: () => void }) {
  return <Link href={item.href} className={className} onClick={onClick}>{item.label}</Link>;
}

export function Button({ href, children, variant = "burnt" }: { href: string; children: ReactNode; variant?: "burnt" | "orange" | "outline" | "outline-navy" }) {
  const styles = {
    burnt: "bg-burnt text-foreground-foreground hover:bg-burnt/90",
    orange: "bg-orange text-navy hover:bg-orange/90",
    outline: "border border-navy/30 text-navy hover:bg-navy/5",
    "outline-navy": "border border-navy-muted/50 text-navy-foreground hover:bg-navy-foreground/10",
  }[variant];
  return (
    <Link href={href} className={`group inline-flex items-center justify-center gap-2 rounded-full border border-ink px-6 py-3 transition-shadow hover:shadow-[4px_4px_0_var(--navy)] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${styles}`}>
      {children}<span className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}

export function SiteShell({ children, year }: { children: ReactNode; year: number }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="min-h-screen">
      <Cursor />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border bg-card/80 px-4 py-2 backdrop-blur">
          <Link href="/" aria-label="ScrapeX home" onClick={close}><Wordmark /></Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            {navLinks.map((n) => (
              <NavItem key={n.label} item={n} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" />
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/quote" onClick={close} className="rounded-lg bg-burnt px-4 py-2 text-sm font-semibold text-foreground-foreground hover:bg-burnt/90">Get a quote</Link>
            <button className="rounded-full border p-2 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="mx-auto mt-2 max-w-6xl rounded-3xl border bg-card px-4 py-3 lg:hidden" aria-label="Mobile">
            {navLinks.map((n) => (
              <NavItem key={n.label} item={n} onClick={close} className="block py-2 text-sm" />
            ))}
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <footer className="mt-24 bg-navy px-4 pb-8 pt-16 text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Wordmark onNavy />
            <p className="mt-3 text-navy-muted">ScrapeX. Web data, ready to use.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="label-mono text-navy-muted">Product</p>
            {navLinks.map((n) => <NavItem key={n.label} item={n} className="block hover:text-orange" />)}
            <Link href="/quote" className="block hover:text-orange">Get a quote</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="label-mono text-navy-muted">Legal</p>
            <Link href="/privacy" className="block hover:text-orange">Privacy</Link>
            <Link href="/terms" className="block hover:text-orange">Terms</Link>
            <Link href="/remove" className="block hover:text-orange">Remove my information</Link>
          </div>
        </div>
        <p className="mx-auto mt-16 max-w-6xl select-none font-display text-[22vw] font-extrabold leading-none tracking-tighter text-navy-foreground/10 md:text-[13rem]">ScrapeX</p>
        <p className="mx-auto mt-4 max-w-6xl border-t border-navy-line pt-6 text-xs text-navy-muted">© {year} ScrapeX · scrapex.site · Public data only.</p>
      </footer>
    </div>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Section({ id, navy, children, className = "" }: { id?: string; navy?: boolean; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`px-4 py-20 md:py-28 ${navy ? "bg-navy text-navy-foreground" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHead({ label, title, sub, navy }: { label: string; title: ReactNode; sub?: string; navy?: boolean }) {
  return (
    <Reveal className="mb-12 max-w-2xl">
      <p className={`label-mono ${navy ? "text-orange" : "text-foreground"}`}>{label}</p>
      <h2 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h2>
      {sub && <p className={`mt-4 text-lg ${navy ? "text-navy-muted" : "text-muted-foreground"}`}>{sub}</p>}
    </Reveal>
  );
}

export function Card({ children, navy, className = "" }: { children: ReactNode; navy?: boolean; className?: string }) {
  return (
    <div className={`h-full rounded-3xl border p-6 transition-all hover:-translate-y-1.5 hover:-rotate-[0.6deg] ${navy ? "border-navy-line bg-navy-foreground/5 hover:border-orange/60" : "bg-card hover:border-navy/30"} ${className}`}>
      {children}
    </div>
  );
}

export function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

export type Status = "Confirmed" | "Inferred" | "New" | "Updated";
export function Badge({ status }: { status: Status }) {
  const good = status === "Confirmed" || status === "New";
  return good ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-confirmed px-2 py-0.5 text-xs font-semibold text-foreground-foreground">{status === "Confirmed" ? "✓" : "+"} {status}</span>
  ) : (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-inferred-tint px-2 py-0.5 text-xs font-semibold text-inferred ring-1 ring-inferred/30">~ {status}</span>
  );
}

export function PageHero({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <section className="bg-navy px-4 py-20 text-navy-foreground md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="label-mono text-orange">{label}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-navy-muted">{sub}</p>
      </div>
    </section>
  );
}

export const fieldClass = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-2 focus:outline-burnt";

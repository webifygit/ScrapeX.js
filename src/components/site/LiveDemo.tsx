"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { fieldClass, Icon } from "./Layout";
import {
  DEMO_CONTACT_LIMIT,
  demoStartSchema,
  demoVerifySchema,
  exportFormatLabels,
  exportFormats,
  OTP_LENGTH,
} from "@/lib/demo/schema";
import type { Contact, RunEvent, RunSummary } from "@/lib/demo/types";

type Stage = "target" | "code" | "running" | "done";
type Skipped = { url: string; reason: string };

const steps: { id: Stage; label: string }[] = [
  { id: "target", label: "Target" },
  { id: "code", label: "Verify" },
  { id: "done", label: "Contacts" },
];

type Scanning = { url: string; title: string; count: number };

const stageIndex: Record<Stage, number> = { target: 0, code: 1, running: 2, done: 2 };

export function LiveDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("target");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [maskedEmail, setMaskedEmail] = useState("");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [scanning, setScanning] = useState<Scanning | null>(null);
  const [skipped, setSkipped] = useState<Skipped[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const lastStart = useRef<{ url: string; email: string; whatsapp: string; consent: true } | null>(
    null,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const runScrape = useCallback(async () => {
    setStage("running");
    setContacts([]);
    setScanning(null);
    setSkipped([]);
    setSummary(null);
    setNotice("");

    let response: Response;
    try {
      response = await fetch("/api/demo/run", { method: "POST" });
    } catch {
      setNotice("We lost the connection before the scrape started. Try again.");
      setStage("code");
      return;
    }

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({ error: "" }));
      setNotice(body.error || "The scrape couldn't start. Try again.");
      setStage("code");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const handle = (event: RunEvent) => {
      if (event.type === "contact") setContacts((current) => [...current, event.contact]);
      else if (event.type === "page")
        setScanning({ url: event.url, title: event.title, count: event.pagesScanned });
      else if (event.type === "skip") setSkipped((current) => [...current, event]);
      else if (event.type === "done") {
        setSummary(event.summary);
        setStage("done");
      } else if (event.type === "error") {
        setNotice(event.message);
        setStage("code");
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          handle(JSON.parse(line) as RunEvent);
        } catch {
          // A half-written line can only be the last one; the buffer keeps it.
        }
      }
    }
  }, []);

  const submitTarget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = demoStartSchema.safeParse({
      url: String(form.get("url") ?? ""),
      email: String(form.get("email") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      consent: form.get("consent") === "on",
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      setFieldErrors(errors);
      setNotice("");
      return;
    }

    setFieldErrors({});
    setNotice("");
    setBusy(true);
    lastStart.current = { ...parsed.data, whatsapp: parsed.data.whatsapp ?? "", consent: true };

    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lastStart.current),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.fields) setFieldErrors(body.fields);
        setNotice(body.fields ? "" : (body.error ?? "Something went wrong."));
        return;
      }
      setMaskedEmail(body.maskedEmail);
      setTarget(body.url);
      setCode("");
      setCooldown(Math.round((body.resendInMs ?? 60000) / 1000));
      setStage("code");
    } catch {
      setNotice("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = demoVerifySchema.safeParse({ code });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/demo/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) {
        setNotice(body.error ?? "That code isn't right.");
        return;
      }
      await runScrape();
    } catch {
      setNotice("We couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!lastStart.current || cooldown > 0) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lastStart.current),
      });
      const body = await response.json();
      if (!response.ok) {
        setNotice(body.error ?? "We couldn't send another code.");
        return;
      }
      setCooldown(Math.round((body.resendInMs ?? 60000) / 1000));
      setNotice("A new code is on its way.");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStage("target");
    setCode("");
    setContacts([]);
    setScanning(null);
    setSkipped([]);
    setSummary(null);
    setNotice("");
    setFieldErrors({});
  };

  return (
    <div className="space-y-6">
      <Stepper current={stageIndex[stage]} />

      {notice && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {notice}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {stage === "target" && (
          <Panel key="target" reduce={reduce}>
            <form onSubmit={submitTarget} noValidate className="space-y-5">
              <Field
                name="url"
                label="Page to scrape"
                placeholder="example-store.com/catalog"
                error={fieldErrors.url}
                hint={`We follow links from here until we have ${DEMO_CONTACT_LIMIT} contact details.`}
                autoComplete="url"
              />
              <Field
                name="email"
                label="Company email"
                type="email"
                placeholder="you@yourcompany.com"
                error={fieldErrors.email}
                hint="Your code goes here. Free mailboxes like Gmail or Outlook aren't accepted."
                autoComplete="email"
              />
              <Field
                name="whatsapp"
                label="WhatsApp number"
                type="tel"
                optional
                placeholder="+91 98765 43210"
                error={fieldErrors.whatsapp}
                hint="Only if you'd like us to follow up there."
                autoComplete="tel"
              />

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-0.5 h-4 w-4 rounded border-input accent-lime"
                  aria-invalid={!!fieldErrors.consent}
                />
                <span>
                  This is a public page and I may ask for it to be scraped. We read{" "}
                  <code className="font-mono text-xs">robots.txt</code> first and skip anything it
                  disallows — see{" "}
                  <Link
                    href="/trust"
                    className="underline decoration-lime decoration-2 underline-offset-4"
                  >
                    how we scrape
                  </Link>
                  .
                </span>
              </label>
              {fieldErrors.consent && (
                <p className="text-sm text-destructive">{fieldErrors.consent}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full border border-ink bg-lime px-5 py-3 text-sm font-semibold text-ink transition-shadow hover:shadow-[4px_4px_0_var(--navy)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Sending your code…" : "Send verification code"}
              </button>
            </form>
          </Panel>
        )}

        {stage === "code" && (
          <Panel key="code" reduce={reduce}>
            <form onSubmit={submitCode} noValidate className="space-y-5">
              <div>
                <p className="label-mono text-muted-foreground">Step 2</p>
                <h3 className="mt-2 text-2xl font-bold">Enter your code</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent {OTP_LENGTH} digits to{" "}
                  <strong className="text-foreground">{maskedEmail}</strong>. It unlocks a demo
                  scrape of <span className="font-mono text-xs">{target}</span>.
                </p>
              </div>

              <div>
                <label htmlFor="code" className="text-sm font-medium">
                  Verification code
                </label>
                <input
                  id="code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="000000"
                  className={`${fieldClass} text-center font-mono text-2xl tracking-[0.5em]`}
                />
              </div>

              <button
                type="submit"
                disabled={busy || code.length !== OTP_LENGTH}
                className="w-full rounded-full border border-ink bg-lime px-5 py-3 text-sm font-semibold text-ink transition-shadow hover:shadow-[4px_4px_0_var(--navy)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Checking…" : "Verify and start scraping"}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={resend}
                  disabled={busy || cooldown > 0}
                  className="text-muted-foreground underline underline-offset-4 disabled:no-underline disabled:opacity-60"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="text-muted-foreground underline underline-offset-4"
                >
                  Use a different address
                </button>
              </div>
            </form>
          </Panel>
        )}

        {(stage === "running" || stage === "done") && (
          <Panel key="results" reduce={reduce}>
            <Results
              stage={stage}
              contacts={contacts}
              scanning={scanning}
              skipped={skipped}
              summary={summary}
              onRestart={restart}
              reduce={!!reduce}
            />
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({ children, reduce }: { children: React.ReactNode; reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-3xl border bg-card p-6 md:p-8"
    >
      {children}
    </motion.div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink text-sm font-semibold ${
                done
                  ? "bg-ink text-lime"
                  : active
                    ? "bg-lime text-ink"
                    : "bg-card text-muted-foreground"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={`label-mono ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  optional,
  ...input
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {optional && <span className="text-muted-foreground"> (optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        className={fieldClass}
        aria-invalid={!!error}
        aria-describedby={`${name}-hint`}
        {...input}
      />
      <p
        id={`${name}-hint`}
        className={`mt-1 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
      >
        {error ?? hint}
      </p>
    </div>
  );
}

function Results({
  stage,
  contacts,
  scanning,
  skipped,
  summary,
  onRestart,
  reduce,
}: {
  stage: Stage;
  contacts: Contact[];
  scanning: Scanning | null;
  skipped: Skipped[];
  summary: RunSummary | null;
  onRestart: () => void;
  reduce: boolean;
}) {
  const running = stage === "running";
  const progress = Math.round((contacts.length / DEMO_CONTACT_LIMIT) * 100);
  const foundNothing = stage === "done" && contacts.length === 0;

  return (
    <div className="space-y-6">
      <div aria-live="polite">
        {running ? (
          <>
            <p className="label-mono text-muted-foreground">Step 3</p>
            <h3 className="mt-2 flex items-center gap-3 text-2xl font-bold">
              <motion.span
                aria-hidden
                animate={reduce ? {} : { rotate: 360 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink border-t-transparent"
              />
              {contacts.length} of {DEMO_CONTACT_LIMIT} contacts found…
            </h3>
            {scanning && (
              <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                Reading page {scanning.count}: {scanning.url}
              </p>
            )}
          </>
        ) : foundNothing ? (
          <div className="rounded-2xl border-2 border-ink bg-card px-4 py-3">
            <p className="font-display text-xl font-bold">No contact details found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We read {summary?.pagesScanned ?? 0} pages on {summary?.host} and found no email
              addresses or phone numbers in the markup. Plenty of sites hide them behind forms or
              images — that is exactly the sort of thing a real ScrapeX job is built for.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-ink bg-lime px-4 py-3">
            <p className="font-display text-xl font-bold text-ink">Scrape complete ✓</p>
            <p className="mt-1 text-sm text-ink/80">
              {summary?.contacts ?? contacts.length} contacts from {summary?.pagesScanned ?? 0}{" "}
              pages on {summary?.host} in {((summary?.ms ?? 0) / 1000).toFixed(1)}s
              {summary &&
                summary.robotsBlocked > 0 &&
                `, ${summary.robotsBlocked} skipped by robots.txt`}
              . The demo stops at {DEMO_CONTACT_LIMIT} contacts.
            </p>
          </div>
        )}
      </div>

      {running && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full bg-lime"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {contacts.length > 0 && <ContactTable contacts={contacts} reduce={reduce} />}

      {skipped.length > 0 && (
        <details className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">{skipped.length} skipped</summary>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {skipped.slice(0, 10).map((item) => (
              <li key={item.url} className="truncate font-mono text-xs">
                {item.url} — {item.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      {stage === "done" && (
        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          {contacts.length > 0 && <DownloadMenu />}
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-3 text-sm font-semibold transition-shadow hover:shadow-[4px_4px_0_var(--navy)]"
          >
            Get the whole list <span aria-hidden>→</span>
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Run another demo
          </button>
        </div>
      )}
    </div>
  );
}

function DownloadMenu() {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener("click", closeOnOutside);
    return () => document.removeEventListener("click", closeOnOutside);
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-ink bg-lime px-5 py-3 text-sm font-semibold text-ink transition-shadow hover:shadow-[4px_4px_0_var(--navy)]">
        <Icon d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" className="h-4 w-4" />
        Download contacts
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </summary>
      <ul className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-ink bg-card py-1 shadow-[4px_4px_0_var(--navy)]">
        {exportFormats.map((format) => (
          <li key={format}>
            <a
              href={`/api/demo/download?format=${format}`}
              className="block px-4 py-2.5 text-sm hover:bg-muted"
              onClick={() => {
                if (ref.current) ref.current.open = false;
              }}
            >
              {exportFormatLabels[format]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function ContactTable({ contacts, reduce }: { contacts: Contact[]; reduce: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-ink bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-sm font-semibold">Contacts found</p>
        <span className="label-mono text-muted-foreground">
          {contacts.length} of {DEMO_CONTACT_LIMIT}
        </span>
      </div>
      <ul className="divide-y">
        {contacts.map((contact, index) => (
          <motion.li
            key={`${contact.value}-${index}`}
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-start"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-semibold">{contact.value}</p>
              {contact.name && <p className="truncate text-sm">{contact.name}</p>}
              <a
                href={contact.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="truncate text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                {contact.sourceTitle || contact.sourceUrl}
              </a>
              {contact.context && (
                <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                  {contact.context}
                </p>
              )}
            </div>
            <span className="label-mono shrink-0 rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {contact.type}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

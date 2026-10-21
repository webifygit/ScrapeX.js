// Shared by the demo UI and the API routes, so a field is validated the same way
// on both sides. Keep this file free of node builtins — the client imports it.

import { z } from "zod";
import {
  disposableEmailDomains,
  freeEmailDomains,
  reservedEmailDomains,
  reservedTlds,
} from "./email-domains";

/** The demo stops as soon as it has this many contact details. */
export const DEMO_CONTACT_LIMIT = 10;
/** Safety net: how many pages it may read while looking for them. */
export const DEMO_PAGE_SCAN_LIMIT = 20;
export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export type CompanyEmailProblem = "malformed" | "free" | "disposable" | "reserved";

/** Returns why an address is not a company address, or null when it looks fine. */
export function companyEmailProblem(value: string): CompanyEmailProblem | null {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return "malformed";

  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) return "malformed";
  if (domain.includes("..") || /[^a-z0-9.-]/.test(domain)) return "malformed";

  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (tld.length < 2 || reservedTlds.has(tld)) return "reserved";
  if (reservedEmailDomains.has(domain)) return "reserved";
  if (disposableEmailDomains.has(domain)) return "disposable";
  if (freeEmailDomains.has(domain)) return "free";
  return null;
}

const companyEmailMessages: Record<CompanyEmailProblem, string> = {
  malformed: "Enter a valid email address",
  free: "Use your company email — free mailboxes like Gmail or Outlook can't run the demo",
  disposable: "Temporary mailboxes can't run the demo. Use your company email",
  reserved: "That domain isn't a real company domain",
};

export const companyEmail = z
  .string()
  .trim()
  .min(1, "Enter your company email")
  .max(254, "That email is too long")
  .superRefine((value, ctx) => {
    const problem = companyEmailProblem(value);
    if (problem) ctx.addIssue({ code: "custom", message: companyEmailMessages[problem] });
  })
  .transform((value) => value.trim().toLowerCase());

/** Loose E.164: a leading +, then 8–15 digits. Spaces, dashes and brackets are stripped first. */
export const whatsappNumber = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()\-.]/g, ""))
  .refine((value) => value === "" || /^\+[1-9]\d{7,14}$/.test(value), {
    message: "Use the international format, e.g. +919876543210",
  });

export const targetUrl = z
  .string()
  .trim()
  .min(1, "Enter the page you want scraped")
  .max(2048, "That URL is too long")
  .transform((value) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`))
  .superRefine((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "That doesn't look like a web address" });
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: "Only http and https pages can be scraped" });
      return;
    }
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) {
      ctx.addIssue({ code: "custom", message: "Enter a full domain, e.g. example-store.com" });
    }
  });

export const demoStartSchema = z.object({
  url: targetUrl,
  email: companyEmail,
  whatsapp: whatsappNumber.optional().default(""),
  consent: z.literal(true, { error: "Please confirm you may scrape this site" }),
});

export const demoVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
});

export type DemoStartInput = z.infer<typeof demoStartSchema>;

export const exportFormats = ["csv", "xlsx", "json", "md"] as const;
export type ExportFormat = (typeof exportFormats)[number];

export const exportFormatLabels: Record<ExportFormat, string> = {
  xlsx: "Excel (.xlsx)",
  csv: "CSV (.csv)",
  json: "JSON (.json)",
  md: "Markdown (.md)",
};

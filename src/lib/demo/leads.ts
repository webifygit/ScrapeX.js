// Every step a visitor takes through the demo is written down, not just the
// finished ones: an address typed in and then abandoned at the code screen is
// still a lead, and the only record of it is here. One JSON object per line,
// appended, newest last.

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { sendLeadNotification } from "./mailer";
import type { RunSummary } from "./types";

export type LeadEvent = "code_requested" | "code_resent" | "verified" | "completed" | "failed";

export type LeadRecord = {
  at: string;
  event: LeadEvent;
  session: string;
  email: string;
  whatsapp: string;
  url: string;
  ip: string;
  userAgent: string;
  referer: string;
  contacts?: number;
  pagesScanned?: number;
  ms?: number;
  error?: string;
};

export function leadsFile() {
  return process.env.DEMO_LEADS_FILE || join(process.cwd(), "data", "demo-leads.jsonl");
}

/** Never throws: a disk problem must not break a visitor's demo. */
export async function recordLead(record: Omit<LeadRecord, "at">) {
  const line = `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`;
  try {
    const file = leadsFile();
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, line, "utf8");
  } catch (error) {
    console.error("[demo] could not write the lead", error);
  }

  if (record.event !== "completed") return;
  try {
    await sendLeadNotification({
      email: record.email,
      whatsapp: record.whatsapp,
      url: record.url,
      contacts: record.contacts ?? 0,
    });
  } catch (error) {
    console.error("[demo] could not send the lead notification", error);
  }
}

export function summaryFields(summary: RunSummary | null) {
  return summary
    ? { contacts: summary.contacts, pagesScanned: summary.pagesScanned, ms: summary.ms }
    : {};
}

/** Newest first. Unreadable lines are skipped rather than losing the whole file. */
export async function readLeads(limit = 500): Promise<LeadRecord[]> {
  let text: string;
  try {
    text = await readFile(leadsFile(), "utf8");
  } catch {
    return [];
  }
  const rows: LeadRecord[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as LeadRecord);
    } catch {
      continue;
    }
  }
  return rows.reverse().slice(0, limit);
}

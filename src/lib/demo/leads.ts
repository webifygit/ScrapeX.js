// A verified company email that ran the demo is the point of the whole feature,
// so it is written down before anything else can go wrong with it. One JSON
// object per line, appended; the optional notification email is best effort.

import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { sendLeadNotification } from "./mailer";
import type { RunSummary } from "./types";

export type Lead = {
  email: string;
  whatsapp: string;
  url: string;
  ip: string;
  summary: RunSummary | null;
};

function leadsFile() {
  return process.env.DEMO_LEADS_FILE || join(process.cwd(), "data", "demo-leads.jsonl");
}

export async function recordLead(lead: Lead) {
  const line = `${JSON.stringify({ at: new Date().toISOString(), ...lead })}\n`;
  try {
    const file = leadsFile();
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, line, "utf8");
  } catch (error) {
    // A full or read-only disk must not break the visitor's demo.
    console.error("[demo] could not write the lead", error);
  }

  try {
    await sendLeadNotification({
      email: lead.email,
      whatsapp: lead.whatsapp,
      url: lead.url,
      contacts: lead.summary?.contacts ?? 0,
    });
  } catch (error) {
    console.error("[demo] could not send the lead notification", error);
  }
}

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readLeads, recordLead } from "@/lib/demo/leads";

const dir = mkdtempSync(join(tmpdir(), "scrapex-leads-"));
const file = join(dir, "leads.jsonl");
const original = process.env.DEMO_LEADS_FILE;

beforeEach(() => {
  process.env.DEMO_LEADS_FILE = file;
});

afterEach(() => {
  if (original === undefined) delete process.env.DEMO_LEADS_FILE;
  else process.env.DEMO_LEADS_FILE = original;
});

const base = {
  session: "s1",
  email: "buyer@northwind-logistics.com",
  whatsapp: "+919876543210",
  url: "https://example-store.com/",
  ip: "203.0.114.9",
  userAgent: "Mozilla/5.0",
  referer: "https://www.scrapex.site/demo",
};

describe("lead log", () => {
  it("keeps a visitor who never finished", async () => {
    await recordLead({ ...base, event: "code_requested" });
    const rows = await readLeads();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ event: "code_requested", email: base.email });
    expect(rows[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns newest first", async () => {
    await recordLead({ ...base, event: "verified" });
    await recordLead({ ...base, event: "completed", contacts: 7, pagesScanned: 11, ms: 9400 });
    const rows = await readLeads();
    expect(rows.map((r) => r.event)).toEqual(["completed", "verified", "code_requested"]);
    expect(rows[0].contacts).toBe(7);
  });

  it("survives a corrupt line instead of losing the file", async () => {
    writeFileSync(file, `{"at":"2026-10-21T09:00:00.000Z","event":"verified"}\nnot json\n`, "utf8");
    const rows = await readLeads();
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe("verified");
  });

  it("returns nothing when no demo has run yet", async () => {
    process.env.DEMO_LEADS_FILE = join(dir, "does-not-exist.jsonl");
    expect(await readLeads()).toEqual([]);
  });
});

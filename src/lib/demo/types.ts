// Shapes shared by the crawler, the API routes and the demo UI.

export type Contact = {
  type: "email" | "phone";
  value: string;
  name: string;
  context: string;
  sourceUrl: string;
  sourceTitle: string;
  foundAt: string;
  /** Filled in by Apollo when it recognises the address. */
  title?: string;
  company?: string;
  linkedin?: string;
  location?: string;
  enriched?: boolean;
};

export type RunSummary = {
  startUrl: string;
  host: string;
  contacts: number;
  limit: number;
  pagesScanned: number;
  ms: number;
  robotsBlocked: number;
  failed: number;
  enriched: number;
  finishedAt: string;
};

/** One line of the NDJSON stream the run endpoint writes. */
export type RunEvent =
  | { type: "start"; startUrl: string; host: string; limit: number; crawlDelayMs: number }
  | { type: "page"; url: string; title: string; pagesScanned: number }
  | { type: "contact"; contact: Contact; index: number }
  | { type: "skip"; url: string; reason: string }
  | { type: "enriched"; contacts: Contact[]; matched: number }
  | { type: "done"; summary: RunSummary }
  | { type: "error"; message: string };

// Shapes shared by the crawler, the API routes and the demo UI.

export type ScrapedPage = {
  url: string;
  status: number;
  title: string;
  description: string;
  heading: string;
  price: string;
  currency: string;
  links: number;
  images: number;
  emails: string[];
  phones: string[];
  words: number;
  bytes: number;
  ms: number;
  fetchedAt: string;
};

export type RunSummary = {
  startUrl: string;
  host: string;
  pages: number;
  limit: number;
  ms: number;
  robotsBlocked: number;
  failed: number;
  finishedAt: string;
};

/** One line of the NDJSON stream the run endpoint writes. */
export type RunEvent =
  | { type: "start"; startUrl: string; host: string; limit: number; crawlDelayMs: number }
  | { type: "page"; page: ScrapedPage; index: number }
  | { type: "skip"; url: string; reason: string }
  | { type: "done"; summary: RunSummary }
  | { type: "error"; message: string };

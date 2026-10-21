// The demo crawler. Deliberately small and deliberately polite: one request at a
// time, a page cap, robots.txt honoured, every redirect re-checked against the
// SSRF guard, and hard limits on time and bytes so one visitor cannot tie up the
// droplet.

import { checkUrlReachable } from "./net-guard";
import { extractPage } from "./extract";
import { emptyRules, parseRobots, robotsAllows, type RobotsRules } from "./robots";
import { cacheRobots, cachedRobots } from "./store";
import type { RunEvent, RunSummary, ScrapedPage } from "./types";

export const USER_AGENT = "ScrapeXDemoBot/1.0 (+https://www.scrapex.site/trust)";

const PAGE_TIMEOUT_MS = 8_000;
const TOTAL_BUDGET_MS = 75_000;
const MAX_BYTES = 1_500_000;
const MIN_DELAY_MS = 400;
const MAX_REDIRECTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Fetched = { status: number; html: string; bytes: number; finalUrl: string };

async function readCapped(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    text += decoder.decode(value, { stream: true });
  }
  return { text: text + decoder.decode(), bytes };
}

/** Fetches one page, re-validating the target on every redirect hop. */
async function fetchPage(startUrl: string): Promise<Fetched> {
  let target = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const check = await checkUrlReachable(target);
    if (!check.ok) throw new Error(check.reason);

    const response = await fetch(check.url, {
      redirect: "manual",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en",
      },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error(`Redirect with no destination (${response.status})`);
      target = new URL(location, check.url).toString();
      continue;
    }

    const type = response.headers.get("content-type") ?? "";
    if (type && !/text\/html|application\/xhtml/i.test(type)) {
      await response.body?.cancel();
      throw new Error(`Not an HTML page (${type.split(";")[0]})`);
    }

    const { text, bytes } = await readCapped(response);
    return { status: response.status, html: text, bytes, finalUrl: check.url.toString() };
  }
  throw new Error("Too many redirects");
}

async function loadRobots(origin: string): Promise<RobotsRules> {
  const cached = cachedRobots(origin);
  if (cached !== null) return parseRobots(cached, USER_AGENT);
  try {
    const response = await fetch(new URL("/robots.txt", origin), {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    // Anything but a 2xx with a body means "no rules published".
    const text = response.ok ? (await response.text()).slice(0, 200_000) : "";
    cacheRobots(origin, text);
    return parseRobots(text, USER_AGENT);
  } catch {
    cacheRobots(origin, "");
    return { ...emptyRules };
  }
}

/** Same site means same hostname, give or take a leading www. */
function sameSite(a: URL, b: URL) {
  const strip = (host: string) => host.replace(/^www\./, "");
  return strip(a.hostname) === strip(b.hostname);
}

export async function crawl(
  rawUrl: string,
  limit: number,
  emit: (event: RunEvent) => void,
): Promise<RunSummary> {
  const started = Date.now();
  const check = await checkUrlReachable(rawUrl);
  if (!check.ok) throw new Error(check.reason);

  const start = check.url;
  const rules = await loadRobots(start.origin);
  const crawlDelayMs = Math.max(MIN_DELAY_MS, rules.crawlDelayMs);

  emit({
    type: "start",
    startUrl: start.toString(),
    host: start.hostname,
    limit,
    crawlDelayMs,
  });

  const queue: string[] = [start.toString()];
  const seen = new Set<string>([start.toString()]);
  const pages: ScrapedPage[] = [];
  let robotsBlocked = 0;
  let failed = 0;

  while (queue.length > 0 && pages.length < limit) {
    if (Date.now() - started > TOTAL_BUDGET_MS) break;
    const next = queue.shift() as string;
    const url = new URL(next);

    if (!robotsAllows(rules, url.pathname + url.search)) {
      robotsBlocked += 1;
      emit({ type: "skip", url: next, reason: "Disallowed by robots.txt" });
      continue;
    }

    if (pages.length > 0) await sleep(crawlDelayMs);

    const pageStarted = Date.now();
    try {
      const { status, html, bytes, finalUrl } = await fetchPage(next);
      const fields = extractPage(html, finalUrl);
      const page: ScrapedPage = {
        url: finalUrl,
        status,
        title: fields.title,
        description: fields.description,
        heading: fields.heading,
        price: fields.price,
        currency: fields.currency,
        links: fields.links.length,
        images: fields.images,
        emails: fields.emails,
        phones: fields.phones,
        words: fields.words,
        bytes,
        ms: Date.now() - pageStarted,
        fetchedAt: new Date().toISOString(),
      };
      pages.push(page);
      emit({ type: "page", page, index: pages.length });

      for (const link of fields.links) {
        if (seen.size >= limit * 12 || queue.length >= limit * 4) break;
        let candidate: URL;
        try {
          candidate = new URL(link);
        } catch {
          continue;
        }
        candidate.hash = "";
        const key = candidate.toString();
        if (seen.has(key) || !sameSite(candidate, start)) continue;
        if (
          /\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3|css|js|ico|woff2?)$/i.test(candidate.pathname)
        )
          continue;
        seen.add(key);
        queue.push(key);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Request failed";
      emit({
        type: "skip",
        url: next,
        reason: message.replace(/^The operation was aborted.*/i, "Timed out"),
      });
    }
  }

  return {
    startUrl: start.toString(),
    host: start.hostname,
    pages: pages.length,
    limit,
    ms: Date.now() - started,
    robotsBlocked,
    failed,
    finishedAt: new Date().toISOString(),
  };
}

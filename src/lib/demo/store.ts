// Demo state lives in memory: one PM2 fork serves the site, a session is worth
// ten minutes, and losing them all on a deploy is fine. It hangs off globalThis
// so every route handler shares one instance whatever Next does to the bundles.

import type { RunSummary, ScrapedPage } from "./types";

export type DemoSession = {
  id: string;
  email: string;
  whatsapp: string;
  url: string;
  ip: string;
  otpHash: string;
  otpExpiresAt: number;
  otpSentAt: number;
  attempts: number;
  resends: number;
  verified: boolean;
  createdAt: number;
  running: boolean;
  pages: ScrapedPage[];
  summary: RunSummary | null;
};

type Counter = { count: number; resetAt: number };

type Store = {
  sessions: Map<string, DemoSession>;
  counters: Map<string, Counter>;
  robots: Map<string, { rules: string; fetchedAt: number }>;
  sweptAt: number;
};

const SESSION_TTL_MS = 60 * 60 * 1000;
const globalKey = Symbol.for("scrapex.demo.store");
const holder = globalThis as unknown as Record<symbol, Store | undefined>;

function store(): Store {
  const existing = holder[globalKey];
  if (existing) return existing;
  const fresh: Store = {
    sessions: new Map(),
    counters: new Map(),
    robots: new Map(),
    sweptAt: Date.now(),
  };
  holder[globalKey] = fresh;
  return fresh;
}

/** Drops anything past its time to live. Called on every write, at most once a minute. */
function sweep(now: number) {
  const s = store();
  if (now - s.sweptAt < 60_000) return;
  s.sweptAt = now;
  for (const [id, session] of s.sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) s.sessions.delete(id);
  }
  for (const [key, counter] of s.counters) {
    if (now >= counter.resetAt) s.counters.delete(key);
  }
  for (const [host, entry] of s.robots) {
    if (now - entry.fetchedAt > 10 * 60 * 1000) s.robots.delete(host);
  }
}

export function putSession(session: DemoSession) {
  const now = Date.now();
  sweep(now);
  store().sessions.set(session.id, session);
}

export function getSession(id: string | undefined): DemoSession | null {
  if (!id) return null;
  const session = store().sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    store().sessions.delete(id);
    return null;
  }
  return session;
}

export function dropSession(id: string) {
  store().sessions.delete(id);
}

/**
 * Counts one hit against a key and says whether it is still under the limit.
 * The window starts at the first hit and is fixed, not sliding — close enough
 * to keep a demo endpoint from being hammered.
 */
export function hitLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const counters = store().counters;
  const current = counters.get(key);
  if (!current || now >= current.resetAt) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

export function cachedRobots(host: string) {
  const entry = store().robots.get(host);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > 10 * 60 * 1000) {
    store().robots.delete(host);
    return null;
  }
  return entry.rules;
}

export function cacheRobots(host: string, rules: string) {
  store().robots.set(host, { rules, fetchedAt: Date.now() });
}

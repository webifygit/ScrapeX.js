// Enough of the robots.txt convention for a polite crawler: the group for our
// agent (falling back to *), longest-match wins between Allow and Disallow, and
// the crawl delay the site asks for.

export type RobotsRules = { allow: string[]; disallow: string[]; crawlDelayMs: number };

export const emptyRules: RobotsRules = { allow: [], disallow: [], crawlDelayMs: 0 };

export function parseRobots(text: string, userAgent: string): RobotsRules {
  const agent = userAgent.toLowerCase();
  const groups = new Map<string, RobotsRules>();
  let current: string[] = [];
  let expectingAgents = true;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!expectingAgents) {
        current = [];
        expectingAgents = true;
      }
      current.push(value.toLowerCase());
      if (!groups.has(value.toLowerCase()))
        groups.set(value.toLowerCase(), { ...emptyRules, allow: [], disallow: [] });
      continue;
    }
    if (current.length === 0) continue;
    expectingAgents = false;

    for (const name of current) {
      const rules = groups.get(name);
      if (!rules) continue;
      if (field === "disallow" && value) rules.disallow.push(value);
      else if (field === "allow" && value) rules.allow.push(value);
      else if (field === "crawl-delay") {
        const seconds = Number.parseFloat(value);
        if (Number.isFinite(seconds) && seconds > 0)
          rules.crawlDelayMs = Math.min(seconds, 5) * 1000;
      }
    }
  }

  return groups.get(agent) ?? groups.get("*") ?? { ...emptyRules };
}

function patternToRegex(pattern: string) {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}${anchored ? "$" : ""}`);
}

function longestMatch(patterns: string[], path: string) {
  let best = -1;
  for (const pattern of patterns) {
    if (patternToRegex(pattern).test(path) && pattern.length > best) best = pattern.length;
  }
  return best;
}

export function robotsAllows(rules: RobotsRules, pathWithQuery: string) {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  const disallow = longestMatch(rules.disallow, path);
  if (disallow < 0) return true;
  return longestMatch(rules.allow, path) >= disallow;
}

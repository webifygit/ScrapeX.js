// Apollo enrichment: the scraper finds the address, Apollo says whose it is.
// Strictly additive — if the key is missing, the plan does not allow API access
// or Apollo simply has no record, the demo carries on with what it scraped.

const endpoint = "https://api.apollo.io/api/v1/people/bulk_match";

// Apollo's bulk endpoint takes ten people per request, which is exactly the
// demo's own ceiling, so one call covers a whole run.
const BATCH = 10;

export type Enrichment = {
  name: string;
  title: string;
  company: string;
  linkedin: string;
  location: string;
};

export function apolloConfigured() {
  return Boolean(process.env.APOLLO_API_KEY);
}

type ApolloPerson = {
  email?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  organization?: { name?: string | null } | null;
  account?: { name?: string | null } | null;
};

function toEnrichment(person: ApolloPerson): Enrichment | null {
  const name =
    person.name?.trim() ||
    [person.first_name, person.last_name].filter(Boolean).join(" ").trim() ||
    "";
  const enrichment: Enrichment = {
    name,
    title: person.title?.trim() ?? "",
    company: person.organization?.name?.trim() || person.account?.name?.trim() || "",
    linkedin: person.linkedin_url?.trim() ?? "",
    location: [person.city, person.state, person.country].filter(Boolean).join(", "),
  };
  // A match with nothing in it is worse than no match: it would overwrite a
  // name the address itself gave us.
  return Object.values(enrichment).some(Boolean) ? enrichment : null;
}

/**
 * Looks up the people behind a set of addresses. Never throws and never asks
 * Apollo to reveal anything it would charge extra for — we already have the
 * address, we only want the person attached to it.
 */
export async function enrichByEmail(emails: string[]): Promise<Map<string, Enrichment>> {
  const found = new Map<string, Enrichment>();
  const key = process.env.APOLLO_API_KEY;
  if (!key || emails.length === 0) return found;

  for (let start = 0; start < emails.length; start += BATCH) {
    const batch = emails.slice(start, start + BATCH);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": key,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ details: batch.map((email) => ({ email })) }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        const reason = await response.text().catch(() => "");
        console.error("[demo] apollo refused the lookup", response.status, reason.slice(0, 300));
        return found;
      }

      const body = (await response.json()) as { matches?: (ApolloPerson | null)[] };
      const matches = Array.isArray(body.matches) ? body.matches : [];
      matches.forEach((person, index) => {
        if (!person) return;
        const enrichment = toEnrichment(person);
        // Apollo returns matches positionally, but echoes the email too; trust
        // the echo when it is there in case a batch comes back reordered.
        const email = (person.email ?? batch[index] ?? "").toLowerCase();
        if (enrichment && email) found.set(email, enrichment);
      });
    } catch (error) {
      console.error("[demo] could not reach apollo", error);
      return found;
    }
  }

  return found;
}

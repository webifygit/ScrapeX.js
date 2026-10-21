// Pulling fields out of a page with regexes rather than a DOM is deliberate: the
// demo reads ten public pages for a handful of well-known fields, and that is
// not worth a parser dependency on a production marketing site.

// The HTML 4 Latin-1 names map straight onto code points 160-255, in order, so
// the table is a word list rather than a hundred hand-written pairs.
const latin1Names =
  "nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml".split(
    " ",
  );

const punctuation: Record<string, number> = {
  ensp: 8194,
  emsp: 8195,
  thinsp: 8201,
  zwnj: 8204,
  zwj: 8205,
  ndash: 8211,
  mdash: 8212,
  lsquo: 8216,
  rsquo: 8217,
  sbquo: 8218,
  ldquo: 8220,
  rdquo: 8221,
  bdquo: 8222,
  dagger: 8224,
  Dagger: 8225,
  bull: 8226,
  hellip: 8230,
  permil: 8240,
  prime: 8242,
  Prime: 8243,
  lsaquo: 8249,
  rsaquo: 8250,
  oline: 8254,
  frasl: 8260,
  euro: 8364,
  trade: 8482,
  larr: 8592,
  uarr: 8593,
  rarr: 8594,
  darr: 8595,
  harr: 8596,
  minus: 8722,
  ne: 8800,
  le: 8804,
  ge: 8805,
};

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

for (const [index, name] of latin1Names.entries()) {
  entities[name.toLowerCase()] ??= String.fromCodePoint(160 + index);
}
for (const [name, code] of Object.entries(punctuation)) {
  entities[name.toLowerCase()] = String.fromCodePoint(code);
}

export function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, name: string) => {
    const key = name.toLowerCase();
    if (entities[key] !== undefined) return entities[key];
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return match;
  });
}

export function stripTags(html: string) {
  return collapse(
    decodeEntities(
      html
        .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function collapse(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const emailPattern = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;
const phonePattern = /\+\d[\d\s().-]{7,17}\d/g;

export type Extracted = { title: string; links: string[] };

/** The page's title and the links worth following. Contacts come from extractContacts. */
export function extractPage(html: string, baseUrl: string): Extracted {
  const title =
    collapse(decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")) ||
    collapse(
      decodeEntities(
        html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
          "",
      ),
    );

  const links: string[] = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)[^>]*>/gi)) {
    const href = decodeEntities(match[1].replace(/^["']|["']$/g, "")).trim();
    if (!href || href.startsWith("#")) continue;
    if (/^(javascript|mailto|tel|data):/i.test(href)) continue;
    const absolute = resolve(href, baseUrl);
    if (absolute) links.push(absolute);
  }

  return { title, links };
}

function resolve(href: string, baseUrl: string) {
  try {
    const url = new URL(href, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

// --- contacts -------------------------------------------------------------

// An address-shaped string whose "domain" is really a filename is a sprite or a
// stylesheet, not a person.
const fileEndings =
  /\.(png|jpe?g|gif|webp|svg|css|js|json|html?|php|ico|woff2?|ttf|eot|mp4|webm)$/i;

const genericMailboxes = new Set([
  "info",
  "sales",
  "support",
  "contact",
  "hello",
  "admin",
  "office",
  "enquiries",
  "inquiries",
  "help",
  "team",
  "mail",
  "press",
  "careers",
  "jobs",
  "hr",
  "billing",
  "accounts",
  "noreply",
  "no-reply",
  "donotreply",
]);

/** j.reyes@acme.com → "J. Reyes". Generic mailboxes get no name. */
export function nameFromEmail(email: string) {
  const local = email.slice(0, email.indexOf("@")).toLowerCase();
  if (genericMailboxes.has(local)) return "";
  const parts = local.split(/[._-]+/);
  if (parts.length < 2 || parts.length > 3) return "";
  if (!parts.every((part) => /^[a-z]+$/.test(part))) return "";
  if (!parts.some((part) => part.length > 1)) return "";
  return parts
    .map((part) =>
      part.length === 1 ? `${part.toUpperCase()}.` : part[0].toUpperCase() + part.slice(1),
    )
    .join(" ");
}

/** The words around a hit, so a visitor can see where it came from. */
function contextAround(text: string, value: string) {
  const at = text.toLowerCase().indexOf(value.toLowerCase());
  if (at < 0) return "";
  const from = Math.max(0, at - 60);
  const snippet = text.slice(from, Math.min(text.length, at + value.length + 60)).trim();
  return `${from > 0 ? "…" : ""}${snippet}${at + value.length + 60 < text.length ? "…" : ""}`;
}

/** An anchor's visible words, unless they are just the address repeated back. */
function linkText(inner: string) {
  const words = stripTags(inner);
  if (words.length < 3 || words.length > 120) return "";
  return /^[^\s@]+@[^\s@]+$/.test(words) || /^\+?[\d\s().-]+$/.test(words) ? "" : words;
}

export type FoundContact = {
  type: "email" | "phone";
  value: string;
  name: string;
  context: string;
};

/** Every email and phone number on the page, de-duplicated, in reading order. */
export function extractContacts(html: string, text = stripTags(html)): FoundContact[] {
  const found: FoundContact[] = [];
  const seen = new Set<string>();

  const addEmail = (raw: string, described = "") => {
    const value = raw
      .trim()
      .toLowerCase()
      .replace(/^mailto:/, "")
      .split("?")[0];
    if (!value || fileEndings.test(value) || value.length > 254) return;
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/.test(value)) return;
    if (seen.has(value)) return;
    seen.add(value);
    found.push({
      type: "email",
      value,
      name: nameFromEmail(value),
      context: described || contextAround(text, value),
    });
  };

  const addPhone = (raw: string, described = "") => {
    const value = raw.replace(/\s+/g, " ").trim();
    const digits = value.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return;
    const key = `tel:${digits}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({
      type: "phone",
      value,
      name: "",
      context: described || contextAround(text, value),
    });
  };

  // Linked details come first, and the link's own words describe them better
  // than the page text around the address ever could.
  for (const match of html.matchAll(
    /<a\b[^>]*href\s*=\s*["']mailto:([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    addEmail(decodeEntities(match[1]), linkText(match[2]));
  }
  for (const match of html.matchAll(
    /<a\b[^>]*href\s*=\s*["']tel:([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    addPhone(decodeEntities(match[1]), linkText(match[2]));
  }
  for (const match of text.matchAll(emailPattern)) addEmail(match[0]);
  for (const match of text.matchAll(phonePattern)) addPhone(match[0]);

  return found;
}

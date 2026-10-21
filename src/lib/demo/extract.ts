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

function attributes(tag: string) {
  const found: Record<string, string> = {};
  const re = /([a-z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag))) {
    found[match[1].toLowerCase()] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
  }
  return found;
}

function metaTags(html: string) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attributes(m[0]));
}

function metaContent(metas: Record<string, string>[], keys: string[]) {
  for (const key of keys) {
    const hit = metas.find(
      (m) =>
        (m.name ?? "").toLowerCase() === key ||
        (m.property ?? "").toLowerCase() === key ||
        (m.itemprop ?? "").toLowerCase() === key,
    );
    if (hit?.content) return collapse(hit.content);
  }
  return "";
}

/** Walks parsed JSON-LD looking for the first price-shaped value. */
function priceFromJsonLd(html: string): { price: string; currency: string } {
  const blocks = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const block of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(decodeEntities(block[1].trim()));
    } catch {
      continue;
    }
    const found = walkForPrice(data);
    if (found) return found;
  }
  return { price: "", currency: "" };
}

function walkForPrice(node: unknown, depth = 0): { price: string; currency: string } | null {
  if (!node || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkForPrice(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;

  const record = node as Record<string, unknown>;
  const raw = record.price ?? record.lowPrice ?? record.highPrice;
  if (typeof raw === "string" || typeof raw === "number") {
    const price = String(raw).trim();
    if (price) {
      const currency = record.priceCurrency;
      return { price, currency: typeof currency === "string" ? currency : "" };
    }
  }
  for (const value of Object.values(record)) {
    const found = walkForPrice(value, depth + 1);
    if (found) return found;
  }
  return null;
}

const emailPattern = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;
const phonePattern = /\+\d[\d\s().-]{7,17}\d/g;

export type Extracted = {
  title: string;
  description: string;
  heading: string;
  canonical: string;
  price: string;
  currency: string;
  images: number;
  links: string[];
  emails: string[];
  phones: string[];
  words: number;
};

export function extractPage(html: string, baseUrl: string): Extracted {
  const metas = metaTags(html);
  const title =
    collapse(decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")) ||
    metaContent(metas, ["og:title", "twitter:title"]);
  const heading = stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const description = metaContent(metas, ["description", "og:description", "twitter:description"]);

  const jsonLd = priceFromJsonLd(html);
  const price =
    jsonLd.price || metaContent(metas, ["og:price:amount", "product:price:amount", "price"]);
  const currency =
    jsonLd.currency ||
    metaContent(metas, ["og:price:currency", "product:price:currency", "pricecurrency"]);

  const canonicalTag = html.match(/<link\b[^>]*rel=["']?canonical["']?[^>]*>/i)?.[0] ?? "";
  const canonical = resolve(attributes(canonicalTag).href ?? "", baseUrl);

  const links: string[] = [];
  const emails = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)[^>]*>/gi)) {
    const href = decodeEntities(match[1].replace(/^["']|["']$/g, "")).trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
    if (href.toLowerCase().startsWith("mailto:")) {
      const address = href.slice(7).split("?")[0].trim().toLowerCase();
      if (emailPattern.test(address)) emails.add(address);
      emailPattern.lastIndex = 0;
      continue;
    }
    const absolute = resolve(href, baseUrl);
    if (absolute) links.push(absolute);
  }

  const text = stripTags(html);
  for (const hit of text.matchAll(emailPattern)) emails.add(hit[0].toLowerCase());
  const phones = new Set<string>();
  for (const hit of text.matchAll(phonePattern)) phones.add(collapse(hit[0]));
  for (const match of html.matchAll(/href\s*=\s*["']tel:([^"']+)["']/gi)) {
    phones.add(collapse(decodeEntities(match[1])));
  }

  return {
    title,
    description,
    heading,
    canonical,
    price,
    currency,
    images: [...html.matchAll(/<img\b/gi)].length,
    links,
    emails: [...emails].slice(0, 25),
    phones: [...phones].slice(0, 25),
    words: text ? text.split(" ").length : 0,
  };
}

function resolve(href: string, baseUrl: string) {
  if (!href) return "";
  try {
    const url = new URL(href, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

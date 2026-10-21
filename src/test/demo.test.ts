import { describe, expect, it } from "vitest";

import { extractContacts, extractPage, nameFromEmail, stripTags } from "@/lib/demo/extract";
import { toCsv, toMarkdown, toXlsx } from "@/lib/demo/export";
import { checkUrlShape, isPrivateAddress } from "@/lib/demo/net-guard";
import { parseRobots, robotsAllows } from "@/lib/demo/robots";
import { companyEmailProblem, demoStartSchema, targetUrl } from "@/lib/demo/schema";
import type { Contact } from "@/lib/demo/types";
import { buildXlsx, columnName } from "@/lib/xlsx";

describe("company email gate", () => {
  it("accepts a real company address", () => {
    expect(companyEmailProblem("j.reyes@northwind-logistics.com")).toBeNull();
    expect(companyEmailProblem("Priya@Acme.co.in")).toBeNull();
  });

  it("rejects free mailboxes, throwaways and reserved domains", () => {
    expect(companyEmailProblem("someone@gmail.com")).toBe("free");
    expect(companyEmailProblem("someone@outlook.com")).toBe("free");
    expect(companyEmailProblem("someone@mailinator.com")).toBe("disposable");
    expect(companyEmailProblem("someone@example.com")).toBe("reserved");
    expect(companyEmailProblem("someone@acme.local")).toBe("reserved");
  });

  it("rejects anything that isn't an address", () => {
    expect(companyEmailProblem("not-an-email")).toBe("malformed");
    expect(companyEmailProblem("two@@acme.com")).toBe("malformed");
    expect(companyEmailProblem("someone@acme")).toBe("malformed");
  });
});

describe("target url", () => {
  it("adds the missing scheme and keeps the path", () => {
    expect(targetUrl.parse("example-store.com/catalog?page=3")).toBe(
      "https://example-store.com/catalog?page=3",
    );
  });

  it("turns away schemes that aren't the web", () => {
    expect(targetUrl.safeParse("ftp://example-store.com").success).toBe(false);
    expect(targetUrl.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("start form", () => {
  const good = {
    url: "example-store.com",
    email: "buyer@northwind-logistics.com",
    whatsapp: "+91 98765 43210",
    consent: true,
  };

  it("accepts a complete form and normalises the number", () => {
    const parsed = demoStartSchema.parse(good);
    expect(parsed.whatsapp).toBe("+919876543210");
    expect(parsed.email).toBe("buyer@northwind-logistics.com");
  });

  it("needs the consent box", () => {
    expect(demoStartSchema.safeParse({ ...good, consent: false }).success).toBe(false);
  });

  it("rejects a number that isn't international", () => {
    expect(demoStartSchema.safeParse({ ...good, whatsapp: "98765 43210" }).success).toBe(false);
  });
});

describe("ssrf guard", () => {
  it("knows the addresses a crawler must never touch", () => {
    for (const address of [
      "127.0.0.1",
      "10.0.0.5",
      "172.16.4.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.100.0.1",
      "0.0.0.0",
      "::1",
      "fe80::1",
      "fd00::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
  });

  it("lets public addresses through", () => {
    for (const address of ["134.209.154.95", "8.8.8.8", "2606:4700:4700::1111"]) {
      expect(isPrivateAddress(address), address).toBe(false);
    }
  });

  it("blocks loopback hosts, odd ports, credentials and non-web schemes", () => {
    expect(checkUrlShape("http://localhost/admin").ok).toBe(false);
    expect(checkUrlShape("http://127.0.0.1/").ok).toBe(false);
    expect(checkUrlShape("http://169.254.169.254/latest/meta-data/").ok).toBe(false);
    expect(checkUrlShape("http://router.local/").ok).toBe(false);
    expect(checkUrlShape("https://example-store.com:8080/").ok).toBe(false);
    expect(checkUrlShape("https://user:pass@example-store.com/").ok).toBe(false);
    expect(checkUrlShape("file:///etc/passwd").ok).toBe(false);
  });

  it("allows an ordinary public page", () => {
    expect(checkUrlShape("https://example-store.com/catalog?page=2").ok).toBe(true);
  });
});

describe("robots.txt", () => {
  const text = `
User-agent: *
Disallow: /cart
Disallow: /checkout
Crawl-delay: 1

User-agent: ScrapeXDemoBot
Disallow: /private
Allow: /private/public-page
`;

  it("uses the group for our agent", () => {
    const rules = parseRobots(text, "ScrapeXDemoBot");
    expect(robotsAllows(rules, "/private/thing")).toBe(false);
    expect(robotsAllows(rules, "/private/public-page")).toBe(true);
    // The cart rule belongs to the * group, which we no longer fall back to.
    expect(robotsAllows(rules, "/cart")).toBe(true);
  });

  it("falls back to the wildcard group and reads the crawl delay", () => {
    const rules = parseRobots(text, "SomeOtherBot");
    expect(robotsAllows(rules, "/cart")).toBe(false);
    expect(robotsAllows(rules, "/catalog")).toBe(true);
    expect(rules.crawlDelayMs).toBe(1000);
  });

  it("handles wildcards and end anchors", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /*.json$\nDisallow: /tmp/*/private", "x");
    expect(robotsAllows(rules, "/data/feed.json")).toBe(false);
    expect(robotsAllows(rules, "/data/feed.json?v=1")).toBe(true);
    expect(robotsAllows(rules, "/tmp/a/private")).toBe(false);
  });

  it("allows everything when the file is empty", () => {
    expect(robotsAllows(parseRobots("", "x"), "/anything")).toBe(true);
  });
});

describe("page extraction", () => {
  const html = `<!doctype html>
<html><head>
<title>Our team &mdash; Example Store</title>
<style>.a{color:red}</style>
</head><body>
<h1>Our team</h1>
<a href="/about?page=2">About</a>
<a href="https://example-store.com/support">Support</a>
<a href="mailto:sales@example-store.com">Email</a>
<a href="#top">Top</a>
<a href="/brochure.pdf">Brochure</a>
<script>var tracking = "ignore me";</script>
</body></html>`;

  const page = extractPage(html, "https://example-store.com/team");

  it("decodes the title", () => {
    expect(page.title).toBe("Our team — Example Store");
  });

  it("returns absolute links and leaves out anchors and mailto", () => {
    expect(page.links).toEqual([
      "https://example-store.com/about?page=2",
      "https://example-store.com/support",
      "https://example-store.com/brochure.pdf",
    ]);
  });

  it("leaves script and style content out of the text", () => {
    const text = stripTags(html);
    expect(text).not.toContain("ignore me");
    expect(text).not.toContain("color:red");
  });
});

describe("contacts", () => {
  const html = `<html><body>
<h1>Our team</h1>
<p>Jordan Reyes, AV Services — <a href="mailto:J.Reyes@Example-Store.com">email Jordan</a></p>
<p>Front desk: <a href="tel:+1 555 010 9999">+1 555 010 9999</a></p>
<p>General enquiries go to info@example-store.com or call +44 20 7946 0958.</p>
<p>Spacer image: sprite@2x.png</p>
<p>Duplicate: J.REYES@example-store.com</p>
</body></html>`;

  const found = extractContacts(html);

  it("finds every address and number once", () => {
    expect(found.map((c) => c.value)).toEqual([
      "j.reyes@example-store.com",
      "+1 555 010 9999",
      "info@example-store.com",
      "+44 20 7946 0958",
    ]);
  });

  it("names a person but not a shared mailbox", () => {
    expect(found[0].name).toBe("J. Reyes");
    expect(found.find((c) => c.value.startsWith("info"))?.name).toBe("");
    expect(nameFromEmail("priya.sharma@acme.com")).toBe("Priya Sharma");
    expect(nameFromEmail("sales@acme.com")).toBe("");
    expect(nameFromEmail("x1@acme.com")).toBe("");
  });

  it("describes a linked address with the link's own words", () => {
    expect(found[0].context).toBe("email Jordan");
  });

  it("falls back to the words around an address written in the page text", () => {
    expect(found.find((c) => c.value.startsWith("info"))?.context).toContain("General enquiries");
  });

  it("ignores filenames that look like addresses", () => {
    expect(found.some((c) => c.value.includes("2x.png"))).toBe(false);
  });

  it("marks the type", () => {
    expect(found.filter((c) => c.type === "email")).toHaveLength(2);
    expect(found.filter((c) => c.type === "phone")).toHaveLength(2);
  });
});

describe("exports", () => {
  const contacts: Contact[] = [
    {
      type: "email",
      value: "j.reyes@example-store.com",
      name: "J Reyes",
      context: 'Jordan Reyes, "AV Services", email\nJordan',
      sourceUrl: "https://example-store.com/team",
      sourceTitle: "Our team",
      foundAt: "2026-10-21T09:00:00.000Z",
    },
  ];

  it("escapes quotes, commas and newlines in CSV", () => {
    const csv = toCsv(contacts);
    expect(csv.startsWith("\uFEFF#,Type,Contact,Name")).toBe(true);
    expect(csv).toContain('"Jordan Reyes, ""AV Services"", email\nJordan"');
  });

  it("writes a markdown table", () => {
    const md = toMarkdown(contacts, null);
    expect(md).toContain("| # | Type | Contact | Name | Source page |");
    expect(md).toContain("j.reyes@example-store.com");
  });

  it("builds a real xlsx package", () => {
    const bytes = toXlsx(contacts, null);
    const text = Buffer.from(bytes).toString("latin1");
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
    expect(text).toContain("xl/worksheets/sheet1.xml");
    expect(text).toContain("[Content_Types].xml");
    expect(text).toContain("&quot;AV Services&quot;");
    expect(text.lastIndexOf("PK\u0005\u0006")).toBeGreaterThan(0);
  });

  it("names spreadsheet columns past Z", () => {
    expect(columnName(0)).toBe("A");
    expect(columnName(25)).toBe("Z");
    expect(columnName(26)).toBe("AA");
    expect(columnName(27)).toBe("AB");
  });

  it("keeps numbers numeric in the sheet", () => {
    const sheet = Buffer.from(buildXlsx([["n", 42]])).toString("latin1");
    expect(sheet).toContain("<v>42</v>");
  });
});

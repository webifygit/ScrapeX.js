// One table, four downloads. The column order is shared so a CSV, a spreadsheet
// and the on-screen table all show the same thing in the same order.

import { buildXlsx, type SheetCell } from "@/lib/xlsx";
import type { ExportFormat } from "./schema";
import type { RunSummary, ScrapedPage } from "./types";

export const columns = [
  { key: "index", label: "#", width: 5 },
  { key: "url", label: "URL", width: 52 },
  { key: "status", label: "Status", width: 8 },
  { key: "title", label: "Title", width: 40 },
  { key: "heading", label: "H1", width: 32 },
  { key: "description", label: "Description", width: 48 },
  { key: "price", label: "Price", width: 12 },
  { key: "currency", label: "Currency", width: 10 },
  { key: "emails", label: "Emails", width: 30 },
  { key: "phones", label: "Phones", width: 20 },
  { key: "links", label: "Links", width: 8 },
  { key: "images", label: "Images", width: 8 },
  { key: "words", label: "Words", width: 8 },
  { key: "bytes", label: "Bytes", width: 10 },
  { key: "ms", label: "Fetch ms", width: 10 },
  { key: "fetchedAt", label: "Fetched at", width: 22 },
] as const;

function rowFor(page: ScrapedPage, index: number): SheetCell[] {
  return [
    index + 1,
    page.url,
    page.status,
    page.title,
    page.heading,
    page.description,
    page.price,
    page.currency,
    page.emails.join(", "),
    page.phones.join(", "),
    page.links,
    page.images,
    page.words,
    page.bytes,
    page.ms,
    page.fetchedAt,
  ];
}

export function toRows(pages: ScrapedPage[]) {
  return pages.map(rowFor);
}

function csvCell(value: SheetCell) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(pages: ScrapedPage[]) {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const row of toRows(pages)) lines.push(row.map(csvCell).join(","));
  // The BOM is what makes Excel read the file as UTF-8 on a double click.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function toJson(pages: ScrapedPage[], summary: RunSummary | null) {
  return `${JSON.stringify(
    {
      source: "ScrapeX live demo",
      generatedAt: new Date().toISOString(),
      summary,
      pages,
    },
    null,
    2,
  )}\n`;
}

export function toMarkdown(pages: ScrapedPage[], summary: RunSummary | null) {
  const shown = ["index", "url", "status", "title", "price", "emails"] as const;
  const picked = columns.filter((c) => (shown as readonly string[]).includes(c.key));
  const cell = (value: SheetCell) =>
    String(value ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");

  const head = `| ${picked.map((c) => c.label).join(" | ")} |`;
  const rule = `| ${picked.map(() => "---").join(" | ")} |`;
  const body = toRows(pages).map((row) => {
    const byKey = Object.fromEntries(columns.map((c, i) => [c.key, row[i]]));
    return `| ${picked.map((c) => cell(byKey[c.key])).join(" | ")} |`;
  });

  return [
    `# ScrapeX live demo — ${summary?.host ?? "results"}`,
    "",
    summary
      ? `${summary.pages} of ${summary.limit} pages from ${summary.startUrl}, finished ${summary.finishedAt} in ${(summary.ms / 1000).toFixed(1)}s.`
      : "",
    "",
    head,
    rule,
    ...body,
    "",
  ].join("\n");
}

export function toXlsx(pages: ScrapedPage[], summary: RunSummary | null) {
  const rows: SheetCell[][] = [columns.map((c) => c.label), ...toRows(pages)];
  return buildXlsx(rows, {
    sheetName: summary ? `Demo ${summary.host}`.slice(0, 31) : "Demo",
    widths: columns.map((c) => c.width),
  });
}

export const exportMeta: Record<ExportFormat, { extension: string; contentType: string }> = {
  csv: { extension: "csv", contentType: "text/csv; charset=utf-8" },
  xlsx: {
    extension: "xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  json: { extension: "json", contentType: "application/json; charset=utf-8" },
  md: { extension: "md", contentType: "text/markdown; charset=utf-8" },
};

export function exportFilename(summary: RunSummary | null, format: ExportFormat) {
  const host = (summary?.host ?? "scrapex-demo").replace(/[^a-z0-9.-]/gi, "-");
  const day = new Date().toISOString().slice(0, 10);
  return `scrapex-demo-${host}-${day}.${exportMeta[format].extension}`;
}

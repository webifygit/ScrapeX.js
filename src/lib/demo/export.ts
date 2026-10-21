// One table of contacts, four downloads. The column order is shared so the CSV,
// the spreadsheet and the on-screen rows all read the same way.

import { buildXlsx, type SheetCell } from "@/lib/xlsx";
import type { ExportFormat } from "./schema";
import type { Contact, RunSummary } from "./types";

export const columns = [
  { key: "index", label: "#", width: 5 },
  { key: "type", label: "Type", width: 10 },
  { key: "value", label: "Contact", width: 34 },
  { key: "name", label: "Name", width: 22 },
  { key: "sourceTitle", label: "Page title", width: 38 },
  { key: "sourceUrl", label: "Source page", width: 52 },
  { key: "context", label: "Found in", width: 60 },
  { key: "foundAt", label: "Found at", width: 22 },
] as const;

function rowFor(contact: Contact, index: number): SheetCell[] {
  return [
    index + 1,
    contact.type,
    contact.value,
    contact.name,
    contact.sourceTitle,
    contact.sourceUrl,
    contact.context,
    contact.foundAt,
  ];
}

export function toRows(contacts: Contact[]) {
  return contacts.map(rowFor);
}

function csvCell(value: SheetCell) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(contacts: Contact[]) {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const row of toRows(contacts)) lines.push(row.map(csvCell).join(","));
  // The BOM is what makes Excel read the file as UTF-8 on a double click.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function toJson(contacts: Contact[], summary: RunSummary | null) {
  return `${JSON.stringify(
    { source: "ScrapeX live demo", generatedAt: new Date().toISOString(), summary, contacts },
    null,
    2,
  )}\n`;
}

export function toMarkdown(contacts: Contact[], summary: RunSummary | null) {
  const shown = ["index", "type", "value", "name", "sourceUrl"] as const;
  const picked = columns.filter((c) => (shown as readonly string[]).includes(c.key));
  const cell = (value: SheetCell) =>
    String(value ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");

  const body = toRows(contacts).map((row) => {
    const byKey = Object.fromEntries(columns.map((c, i) => [c.key, row[i]]));
    return `| ${picked.map((c) => cell(byKey[c.key])).join(" | ")} |`;
  });

  return [
    `# ScrapeX live demo — ${summary?.host ?? "contacts"}`,
    "",
    summary
      ? `${summary.contacts} contacts from ${summary.pagesScanned} pages on ${summary.startUrl}, finished ${summary.finishedAt} in ${(summary.ms / 1000).toFixed(1)}s.`
      : "",
    "",
    `| ${picked.map((c) => c.label).join(" | ")} |`,
    `| ${picked.map(() => "---").join(" | ")} |`,
    ...body,
    "",
  ].join("\n");
}

export function toXlsx(contacts: Contact[], summary: RunSummary | null) {
  const rows: SheetCell[][] = [columns.map((c) => c.label), ...toRows(contacts)];
  return buildXlsx(rows, {
    sheetName: summary ? `Contacts ${summary.host}`.slice(0, 31) : "Contacts",
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
  return `scrapex-contacts-${host}-${day}.${exportMeta[format].extension}`;
}

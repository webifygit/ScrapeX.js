// Everything the demo has recorded, behind a password, at /leads.
// A route handler rather than a page so the browser's own Basic auth prompt
// does the login — no session, no form, nothing else to maintain.

import { timingSafeEqual } from "node:crypto";
import { readLeads, type LeadRecord } from "@/lib/demo/leads";

export const maxDuration = 30;

const unauthorized = () =>
  new Response("Authentication required\n", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="ScrapeX leads", charset="UTF-8"',
      "cache-control": "no-store",
    },
  });

function passwordMatches(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function authorised(request: Request) {
  const expected = process.env.LEADS_PASSWORD;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  return passwordMatches(decoded.slice(decoded.indexOf(":") + 1), expected);
}

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvColumns = [
  "at",
  "event",
  "email",
  "whatsapp",
  "url",
  "contacts",
  "pagesScanned",
  "ms",
  "ip",
  "userAgent",
  "referer",
  "error",
  "session",
] as const;

function toCsv(rows: LeadRecord[]) {
  const lines = [csvColumns.join(",")];
  for (const row of rows) {
    lines.push(csvColumns.map((key) => csvCell(row[key as keyof LeadRecord])).join(","));
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

const eventColours: Record<string, string> = {
  code_requested: "#e8e6dc",
  code_resent: "#e8e6dc",
  verified: "#d8f34a",
  completed: "#2e7d5b",
  failed: "#b42318",
};

function page(rows: LeadRecord[]) {
  const emails = new Set(rows.map((r) => r.email).filter(Boolean));
  const completed = rows.filter((r) => r.event === "completed").length;
  const verified = rows.filter((r) => r.event === "verified").length;
  const requested = rows.filter((r) => r.event.startsWith("code_")).length;

  const body = rows
    .map((row) => {
      const light = row.event === "completed" || row.event === "failed";
      return `<tr>
  <td class="mono nowrap">${escapeHtml(row.at.replace("T", " ").slice(0, 19))}</td>
  <td><span class="tag" style="background:${eventColours[row.event] ?? "#e8e6dc"};color:${light ? "#fff" : "#1b1b1b"}">${escapeHtml(row.event)}</span></td>
  <td class="mono">${escapeHtml(row.email)}</td>
  <td class="mono nowrap">${escapeHtml(row.whatsapp)}</td>
  <td class="mono trunc" title="${escapeHtml(row.url)}">${escapeHtml(row.url)}</td>
  <td class="num">${row.contacts ?? ""}</td>
  <td class="num">${row.pagesScanned ?? ""}</td>
  <td class="num">${row.ms ? `${(row.ms / 1000).toFixed(1)}s` : ""}</td>
  <td class="mono nowrap">${escapeHtml(row.ip)}</td>
  <td class="mono trunc" title="${escapeHtml(row.userAgent)}">${escapeHtml(row.userAgent)}</td>
  <td class="mono">${escapeHtml(row.error ?? "")}</td>
</tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Demo leads — ScrapeX</title>
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  body { margin:0; background:#f6f5ef; color:#1b1b1b; font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif }
  header { padding:24px 20px 0; max-width:1400px; margin:0 auto }
  h1 { font-size:24px; letter-spacing:-.02em; margin:0 0 4px }
  .sub { color:#6b6b63; font-size:14px; margin:0 0 18px }
  .stats { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:18px }
  .stat { border:1px solid rgba(27,27,27,.14); background:#fdfcf8; border-radius:14px; padding:10px 14px; min-width:120px }
  .stat b { display:block; font-size:22px; line-height:1.2 }
  .stat span { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#6b6b63 }
  .wrap { max-width:1400px; margin:0 auto; padding:0 20px 40px }
  .card { border:1px solid rgba(27,27,27,.14); background:#fdfcf8; border-radius:16px; overflow:auto }
  table { border-collapse:collapse; width:100%; font-size:13px }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#6b6b63; padding:10px 12px; border-bottom:1px solid rgba(27,27,27,.14); position:sticky; top:0; background:#f1efe6; white-space:nowrap }
  td { padding:9px 12px; border-bottom:1px solid rgba(27,27,27,.07); vertical-align:top }
  tr:last-child td { border-bottom:0 }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px }
  .nowrap { white-space:nowrap }
  .num { text-align:right; font-variant-numeric:tabular-nums }
  .trunc { max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .tag { display:inline-block; border-radius:6px; padding:2px 7px; font-size:11px; font-weight:600; white-space:nowrap }
  a.btn { display:inline-block; border:1px solid #1b1b1b; background:#d8f34a; color:#1b1b1b; text-decoration:none; font-weight:600; font-size:13px; border-radius:999px; padding:8px 16px }
  .empty { padding:40px 20px; text-align:center; color:#6b6b63 }
</style>
</head><body>
<header>
  <h1>Demo leads</h1>
  <p class="sub">Every step taken on the live demo, newest first. Showing the most recent ${rows.length}.</p>
  <div class="stats">
    <div class="stat"><b>${emails.size}</b><span>Addresses</span></div>
    <div class="stat"><b>${requested}</b><span>Codes sent</span></div>
    <div class="stat"><b>${verified}</b><span>Verified</span></div>
    <div class="stat"><b>${completed}</b><span>Scrapes run</span></div>
  </div>
  <p><a class="btn" href="/leads?format=csv">Download CSV</a></p>
</header>
<div class="wrap"><div class="card">
${
  rows.length === 0
    ? '<p class="empty">Nothing yet. The first visitor to request a code will appear here.</p>'
    : `<table>
<thead><tr><th>When (UTC)</th><th>Step</th><th>Email</th><th>WhatsApp</th><th>Target</th><th>Contacts</th><th>Pages</th><th>Took</th><th>IP</th><th>Browser</th><th>Error</th></tr></thead>
<tbody>
${body}
</tbody></table>`
}
</div></div>
</body></html>`;
}

export async function GET(request: Request) {
  if (!process.env.LEADS_PASSWORD) {
    return new Response("Lead viewing is not configured.\n", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
  if (!authorised(request)) return unauthorized();

  const rows = await readLeads(1000);

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="scrapex-demo-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  return new Response(page(rows), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

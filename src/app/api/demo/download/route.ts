import { exportFilename, exportMeta, toCsv, toJson, toMarkdown, toXlsx } from "@/lib/demo/export";
import { json, sessionFromCookie } from "@/lib/demo/request";
import { exportFormats, type ExportFormat } from "@/lib/demo/schema";

export async function GET(request: Request) {
  const session = await sessionFromCookie();
  if (!session?.verified) return json({ error: "Your demo session has expired." }, 410);
  if (session.pages.length === 0) return json({ error: "Nothing has been scraped yet." }, 409);

  const asked = new URL(request.url).searchParams.get("format") ?? "csv";
  if (!(exportFormats as readonly string[]).includes(asked)) {
    return json({ error: "Unknown format" }, 400);
  }
  const format = asked as ExportFormat;

  const body =
    format === "xlsx"
      ? (toXlsx(session.pages, session.summary) as unknown as BodyInit)
      : format === "json"
        ? toJson(session.pages, session.summary)
        : format === "md"
          ? toMarkdown(session.pages, session.summary)
          : toCsv(session.pages);

  return new Response(body, {
    headers: {
      "content-type": exportMeta[format].contentType,
      "content-disposition": `attachment; filename="${exportFilename(session.summary, format)}"`,
      "cache-control": "no-store",
    },
  });
}

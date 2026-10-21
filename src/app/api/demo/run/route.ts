import { enrichByEmail } from "@/lib/demo/apollo";
import { crawl } from "@/lib/demo/crawl";
import { recordLead, summaryFields } from "@/lib/demo/leads";
import { json, sessionFromCookie, visitor } from "@/lib/demo/request";
import { DEMO_CONTACT_LIMIT } from "@/lib/demo/schema";
import { hitLimit, putSession } from "@/lib/demo/store";
import type { Contact, RunEvent } from "@/lib/demo/types";
export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await sessionFromCookie();
  if (!session) return json({ error: "Your demo session has expired. Start again." }, 410);
  if (!session.verified) return json({ error: "Verify the code first." }, 403);
  if (session.running) return json({ error: "That scrape is already running." }, 409);

  const perEmail = hitLimit(`run:email:${session.email}`, 3, 24 * 60 * 60 * 1000);
  if (!perEmail.allowed) {
    return json({ error: "This address has used its demo runs for today." }, 429);
  }

  session.running = true;
  session.contacts = [];
  session.summary = null;
  putSession(session);

  const who = visitor(request);
  const encoder = new TextEncoder();
  const contacts: Contact[] = [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (event: RunEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The visitor navigated away; the crawl is bounded, so let it finish quietly.
          open = false;
        }
      };

      try {
        const summary = await crawl(session.url, DEMO_CONTACT_LIMIT, (event) => {
          if (event.type === "contact") contacts.push(event.contact);
          emit(event);
        });
        // Apollo runs once, after the crawl: one lookup for the whole run, and
        // a failure here only costs the extra detail, never the contacts.
        const emails = contacts.filter((c) => c.type === "email").map((c) => c.value);
        const enrichments = await enrichByEmail(emails);
        if (enrichments.size > 0) {
          for (const contact of contacts) {
            const found = enrichments.get(contact.value.toLowerCase());
            if (!found) continue;
            contact.name = found.name || contact.name;
            contact.title = found.title;
            contact.company = found.company;
            contact.linkedin = found.linkedin;
            contact.location = found.location;
            contact.enriched = true;
          }
          emit({ type: "enriched", contacts, matched: enrichments.size });
        }
        summary.enriched = enrichments.size;

        session.contacts = contacts;
        session.summary = summary;
        emit({ type: "done", summary });
        await recordLead({
          event: "completed",
          session: session.id,
          email: session.email,
          whatsapp: session.whatsapp,
          url: session.url,
          ...who,
          ...summaryFields(summary),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "The scrape could not start";
        emit({ type: "error", message });
        await recordLead({
          event: "failed",
          session: session.id,
          email: session.email,
          whatsapp: session.whatsapp,
          url: session.url,
          ...who,
          error: message,
        });
      } finally {
        session.running = false;
        putSession(session);
        open = false;
        try {
          controller.close();
        } catch {
          // Already closed by the disconnect above.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      // nginx buffers proxied responses by default, which would hold the whole
      // stream back until the crawl finished and kill the point of it.
      "x-accel-buffering": "no",
    },
  });
}

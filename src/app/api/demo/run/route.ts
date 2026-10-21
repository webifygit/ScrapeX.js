import { crawl } from "@/lib/demo/crawl";
import { recordLead } from "@/lib/demo/leads";
import { json, sessionFromCookie } from "@/lib/demo/request";
import { DEMO_CONTACT_LIMIT } from "@/lib/demo/schema";
import { hitLimit, putSession } from "@/lib/demo/store";
import type { Contact, RunEvent } from "@/lib/demo/types";
export const maxDuration = 120;

export async function POST() {
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
        session.contacts = contacts;
        session.summary = summary;
        emit({ type: "done", summary });
        await recordLead({
          email: session.email,
          whatsapp: session.whatsapp,
          url: session.url,
          ip: session.ip,
          summary,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "The scrape could not start";
        emit({ type: "error", message });
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

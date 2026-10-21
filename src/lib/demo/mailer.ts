// Mail goes out through Resend's HTTP API: the droplet cannot send its own mail
// (port 25 is blocked and the IP has no reputation), and an API call needs no
// extra dependency. Swapping provider means replacing deliver() and nothing else.

const endpoint = "https://api.resend.com/emails";

export type MailResult = { ok: true } | { ok: false; reason: "unconfigured" | "failed" };

export function mailerConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress() {
  return process.env.DEMO_FROM_EMAIL || "ScrapeX <demo@scrapex.site>";
}

async function deliver(payload: Record<string, unknown>): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "unconfigured" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return { ok: true };
    console.error("[demo] resend rejected the message", response.status, await response.text());
    return { ok: false, reason: "failed" };
  } catch (error) {
    console.error("[demo] could not reach resend", error);
    return { ok: false, reason: "failed" };
  }
}

export function sendOtpEmail(to: string, code: string, target: string) {
  return deliver({
    from: fromAddress(),
    to: [to],
    subject: `${code} is your ScrapeX demo code`,
    text: [
      `Your ScrapeX live demo code is ${code}.`,
      "",
      `It unlocks a demo scrape of ${target} and expires in 10 minutes.`,
      "If you didn't ask for this, ignore this email — nothing will run.",
      "",
      "ScrapeX · https://www.scrapex.site",
    ].join("\n"),
    html: otpHtml(code, target),
  });
}

export function sendLeadNotification(lead: {
  email: string;
  whatsapp: string;
  url: string;
  pages: number;
}) {
  const to = process.env.DEMO_LEADS_EMAIL;
  if (!to) return Promise.resolve<MailResult>({ ok: false, reason: "unconfigured" });
  return deliver({
    from: fromAddress(),
    to: [to],
    reply_to: lead.email,
    subject: `Demo run: ${lead.email}`,
    text: [
      `${lead.email} verified their email and ran the live demo.`,
      "",
      `Target:   ${lead.url}`,
      `Pages:    ${lead.pages}`,
      `WhatsApp: ${lead.whatsapp || "—"}`,
    ].join("\n"),
  });
}

function otpHtml(code: string, target: string) {
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f6f5ef;padding:32px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#1b1b1b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fdfcf8;border:1px solid rgba(27,27,27,.14);border-radius:20px">
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6b6b63">ScrapeX live demo</p>
      <h1 style="margin:8px 0 0;font-size:22px;letter-spacing:-.02em">Your verification code</h1>
    </td></tr>
    <tr><td style="padding:16px 28px">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#44443e">Enter this code to start a demo scrape of <strong style="color:#1b1b1b">${escapeHtml(target)}</strong>.</p>
      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:.32em;background:#d8f34a;border:2px solid #1b1b1b;border-radius:14px;padding:16px 8px;text-align:center">${code}</p>
      <p style="margin:18px 0 0;font-size:13px;color:#6b6b63">The code expires in 10 minutes. If you didn't ask for it, ignore this email — nothing will run.</p>
    </td></tr>
    <tr><td style="padding:8px 28px 28px;border-top:1px solid rgba(27,27,27,.1)">
      <p style="margin:16px 0 0;font-size:12px;color:#6b6b63">ScrapeX · public data only · <a href="https://www.scrapex.site/trust" style="color:#1b1b1b">How we scrape responsibly</a></p>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

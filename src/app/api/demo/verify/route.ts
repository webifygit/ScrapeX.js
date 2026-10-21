import { otpMatches } from "@/lib/demo/otp";
import { recordLead } from "@/lib/demo/leads";
import { json, sessionFromCookie, visitor } from "@/lib/demo/request";
import { DEMO_CONTACT_LIMIT, demoVerifySchema, OTP_MAX_ATTEMPTS } from "@/lib/demo/schema";
import { dropSession, putSession } from "@/lib/demo/store";

export async function POST(request: Request) {
  const session = await sessionFromCookie();
  if (!session) return json({ error: "That code has expired. Start again." }, 410);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send the code as JSON" }, 400);
  }

  const parsed = demoVerifySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Enter the code" }, 422);
  }

  if (Date.now() > session.otpExpiresAt) {
    dropSession(session.id);
    return json({ error: "That code has expired. Start again." }, 410);
  }

  if (!otpMatches(parsed.data.code, session.id, session.otpHash)) {
    session.attempts += 1;
    putSession(session);
    if (session.attempts >= OTP_MAX_ATTEMPTS) {
      dropSession(session.id);
      return json({ error: "Too many wrong codes. Start again." }, 429);
    }
    const left = OTP_MAX_ATTEMPTS - session.attempts;
    return json(
      { error: `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` },
      401,
    );
  }

  session.verified = true;
  session.attempts = 0;
  putSession(session);

  await recordLead({
    event: "verified",
    session: session.id,
    email: session.email,
    whatsapp: session.whatsapp,
    url: session.url,
    ...visitor(request),
  });

  return json({ ok: true, url: session.url, limit: DEMO_CONTACT_LIMIT });
}

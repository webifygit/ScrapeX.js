import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { checkUrlReachable } from "@/lib/demo/net-guard";
import { mailerConfigured, sendOtpEmail } from "@/lib/demo/mailer";
import { hashOtp, maskEmail, newOtp } from "@/lib/demo/otp";
import { clientIp, json, SESSION_COOKIE } from "@/lib/demo/request";
import { demoStartSchema, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from "@/lib/demo/schema";
import { getSession, hitLimit, putSession } from "@/lib/demo/store";

export async function POST(request: Request) {
  const ip = clientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send the form as JSON" }, 400);
  }

  const parsed = demoStartSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return json({ error: "Check the form", fields }, 422);
  }
  const { url, email, whatsapp } = parsed.data;

  const perIp = hitLimit(`start:ip:${ip}`, 6, 60 * 60 * 1000);
  if (!perIp.allowed) {
    return json({ error: "Too many codes requested from here. Try again in an hour." }, 429);
  }
  const perEmail = hitLimit(`start:email:${email}`, 5, 24 * 60 * 60 * 1000);
  if (!perEmail.allowed) {
    return json({ error: "This address has requested too many codes today." }, 429);
  }

  const reachable = await checkUrlReachable(url);
  if (!reachable.ok)
    return json({ error: "Check the form", fields: { url: reachable.reason } }, 422);

  if (!mailerConfigured()) {
    return json(
      { error: "Email verification is not switched on yet. Please use the quote form instead." },
      503,
    );
  }

  const jar = await cookies();
  const existing = getSession(jar.get(SESSION_COOKIE)?.value);
  if (
    existing &&
    Date.now() - existing.otpSentAt < OTP_RESEND_COOLDOWN_MS &&
    existing.email === email
  ) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.otpSentAt)) / 1000);
    return json({ error: `A code is already on its way. Try again in ${wait}s.` }, 429);
  }

  const id = randomUUID();
  const code = newOtp();
  const sent = await sendOtpEmail(email, code, reachable.url.toString());
  if (!sent.ok) {
    return json(
      { error: "We couldn't send the code just now. Please try again in a minute." },
      502,
    );
  }

  const now = Date.now();
  putSession({
    id,
    email,
    whatsapp: whatsapp ?? "",
    url: reachable.url.toString(),
    ip,
    otpHash: hashOtp(code, id),
    otpExpiresAt: now + OTP_TTL_MS,
    otpSentAt: now,
    attempts: 0,
    resends: existing ? existing.resends + 1 : 0,
    verified: false,
    createdAt: now,
    running: false,
    pages: [],
    summary: null,
  });

  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  return json({
    ok: true,
    maskedEmail: maskEmail(email),
    url: reachable.url.toString(),
    expiresInMs: OTP_TTL_MS,
    resendInMs: OTP_RESEND_COOLDOWN_MS,
  });
}

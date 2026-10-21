import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { OTP_LENGTH } from "./schema";

// A restart rotates this when DEMO_OTP_SECRET is unset, which only costs the
// handful of codes in flight at that moment.
const secret = process.env.DEMO_OTP_SECRET || randomUUID();

export function newOtp() {
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(0, max)).padStart(OTP_LENGTH, "0");
}

export function hashOtp(code: string, sessionId: string) {
  return createHmac("sha256", secret).update(`${sessionId}:${code}`).digest("hex");
}

export function otpMatches(code: string, sessionId: string, expected: string) {
  const actual = Buffer.from(hashOtp(code, sessionId));
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

/** j.reyes@acme.com → j••••s@acme.com, so the UI can say where the code went. */
export function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  const name = email.slice(0, at);
  const domain = email.slice(at);
  if (name.length <= 2) return `${name[0]}•${domain}`;
  return `${name[0]}${"•".repeat(Math.min(4, name.length - 2))}${name.at(-1)}${domain}`;
}

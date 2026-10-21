import { cookies } from "next/headers";
import { getSession, type DemoSession } from "./store";

export const SESSION_COOKIE = "scrapex_demo";

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function sessionFromCookie(): Promise<DemoSession | null> {
  const jar = await cookies();
  return getSession(jar.get(SESSION_COOKIE)?.value);
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

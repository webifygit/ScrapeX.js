import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apolloConfigured, enrichByEmail } from "@/lib/demo/apollo";

const original = process.env.APOLLO_API_KEY;

beforeEach(() => {
  process.env.APOLLO_API_KEY = "test-key";
});

afterEach(() => {
  if (original === undefined) delete process.env.APOLLO_API_KEY;
  else process.env.APOLLO_API_KEY = original;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("apollo enrichment", () => {
  it("does nothing without a key", async () => {
    delete process.env.APOLLO_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(apolloConfigured()).toBe(false);
    expect(await enrichByEmail(["a@acme.com"])).toEqual(new Map());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when there is nothing to look up", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await enrichByEmail([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the key and the addresses, and maps the people back", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      ok({
        matches: [
          {
            email: "j.reyes@example-store.com",
            first_name: "Jordan",
            last_name: "Reyes",
            title: "AV Services Manager",
            linkedin_url: "https://www.linkedin.com/in/jreyes",
            city: "Austin",
            state: "TX",
            country: "United States",
            organization: { name: "Example Store" },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const found = await enrichByEmail(["j.reyes@example-store.com"]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.apollo.io/api/v1/people/bulk_match");
    expect(init.headers["x-api-key"]).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({ details: [{ email: "j.reyes@example-store.com" }] });

    expect(found.get("j.reyes@example-store.com")).toEqual({
      name: "Jordan Reyes",
      title: "AV Services Manager",
      company: "Example Store",
      linkedin: "https://www.linkedin.com/in/jreyes",
      location: "Austin, TX, United States",
    });
  });

  it("skips misses and empty matches instead of blanking a contact", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(ok({ matches: [null, { email: "b@acme.com" }] })),
    );
    const found = await enrichByEmail(["a@acme.com", "b@acme.com"]);
    expect(found.size).toBe(0);
  });

  it("gives up quietly when the plan does not allow the call", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "forbidden" }),
    );
    expect(await enrichByEmail(["a@acme.com"])).toEqual(new Map());
  });

  it("gives up quietly when apollo cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await enrichByEmail(["a@acme.com"])).toEqual(new Map());
  });

  it("splits more than ten addresses into separate calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ matches: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await enrichByEmail(Array.from({ length: 12 }, (_, i) => `p${i}@acme.com`));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).details).toHaveLength(10);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).details).toHaveLength(2);
  });
});

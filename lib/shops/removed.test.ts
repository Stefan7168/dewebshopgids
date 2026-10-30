import { describe, expect, it } from "vitest";
import { goneResponse, removedSlugs } from "./removed";

describe("goneResponse", () => {
  it("answers 410 with a noindex Dutch page and the footer identity", async () => {
    const res = goneResponse();
    expect(res.status).toBe(410);
    const html = await res.text();
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain("Deze webshop staat niet meer in de gids");
    expect(html).toContain("info@dewebshopgids.nl");
    expect(html).toMatch(/KvK/);
  });
});

describe("removedSlugs", () => {
  it("is empty without database settings, so the proxy never blocks a page", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect((await removedSlugs()).size).toBe(0);
  });
});

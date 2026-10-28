import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const inserted: unknown[] = [];
let shop: { id: string; domain: string; affiliate_url: string | null } | null = null;
const filters: [string, unknown][] = [];

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "clicks") return { insert: async (row: unknown) => (inserted.push(row), { error: null }) };
      const q = {
        select: () => q,
        eq: (col: string, val: unknown) => (filters.push([col, val]), q),
        maybeSingle: async () => ({ data: shop }),
      };
      return q;
    },
  }),
}));

const { GET } = await import("./route");
const call = (slug: string, headers: Record<string, string> = {}, qs = "") =>
  GET(new NextRequest(`https://dewebshopgids.nl/go/${slug}${qs}`, { headers }), { params: Promise.resolve({ slug }) });

beforeEach(() => {
  inserted.length = 0;
  filters.length = 0;
  shop = { id: "s1", domain: "houtatelier.nl", affiliate_url: null };
});

describe("GET /go/[slug]", () => {
  it("302s to the shop and logs one click without IP or UA", async () => {
    const res = await call("houtatelier", {
      referer: "https://dewebshopgids.nl/webshop/houtatelier",
      "user-agent": "Mozilla/5.0 (iPhone) Mobile",
      "x-vercel-ip-country": "NL",
      "x-forwarded-for": "1.2.3.4",
    }, "?bron=gids");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://houtatelier.nl/");
    expect(inserted).toEqual([
      { shop_id: "s1", referer_path: "/webshop/houtatelier", source: "gids", device: "mobile", country: "NL" },
    ]);
    expect(JSON.stringify(inserted)).not.toContain("1.2.3.4");
    expect(filters).toContainEqual(["status", "published"]);
  });

  it("uses the affiliate URL when present", async () => {
    shop = { id: "s1", domain: "a.nl", affiliate_url: "https://ds1.nl/c/?li=1" };
    expect((await call("a")).headers.get("location")).toBe("https://ds1.nl/c/?li=1");
  });

  it("404s for unknown or unpublished shops and logs nothing", async () => {
    shop = null;
    expect((await call("nope")).status).toBe(404);
    expect(inserted).toHaveLength(0);
  });

  it("404s on malformed slugs without a query", async () => {
    expect((await call("A_B")).status).toBe(404);
    expect(filters).toHaveLength(0);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const revalidated: string[] = [];
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidated.push(p), revalidateTag: (t: string) => revalidated.push(`tag:${t}`) }));
const { POST } = await import("./route");

const call = (body: unknown, auth = "Bearer s3cret") =>
  POST(new NextRequest("https://dewebshopgids.nl/api/revalidate", { method: "POST", headers: { authorization: auth }, body: JSON.stringify(body) }));

beforeEach(() => {
  revalidated.length = 0;
  process.env.REVALIDATE_SECRET = "s3cret";
});

describe("POST /api/revalidate", () => {
  it("rejects a wrong or missing secret", async () => {
    expect((await call({ paths: ["/"] }, "Bearer nope")).status).toBe(401);
    expect((await call({ paths: ["/"] }, "")).status).toBe(401);
    delete process.env.REVALIDATE_SECRET;
    expect((await call({ paths: ["/"] })).status).toBe(401);
    expect(revalidated).toEqual([]);
  });

  it("rejects paths outside the site sections", async () => {
    expect((await call({ paths: ["/admin"] })).status).toBe(400);
    expect((await call({ paths: ["https://evil.test/"] })).status).toBe(400);
    expect((await call({ paths: [] })).status).toBe(400);
    expect(revalidated).toEqual([]);
  });

  it("revalidates shop, category and guide pages", async () => {
    const res = await call({ paths: ["/", "/webshop/houtatelier", "/categorie/meubels", "/gids/2026-week-44"] });
    expect(res.status).toBe(200);
    expect(revalidated).toEqual(["tag:shops", "/", "/webshop/houtatelier", "/categorie/meubels", "/gids/2026-week-44"]);
  });
});

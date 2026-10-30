import { describe, expect, it } from "vitest";
import { hiddenEmbed } from "./hidden";

describe("hiddenEmbed", () => {
  it("is a 404 with a transparent SVG, so no alt text or broken icon shows", async () => {
    const res = hiddenEmbed();
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("image/svg+xml");
    const body = await res.text();
    expect(body).toMatch(/^<svg [^>]*\/>$/);
    expect(body).not.toMatch(/text|Vermeld|Geverifieerd/);
  });
});

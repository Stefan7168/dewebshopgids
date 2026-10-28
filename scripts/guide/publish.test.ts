import { describe, expect, it } from "vitest";
import { emailHtml, slotFor } from "./publish";

describe("guide publish", () => {
  it("acts only at 10:00 Amsterdam on Wednesday and Thursday", () => {
    expect(slotFor(new Date("2026-11-04T09:00:00Z"))).toBe("fallback"); // Wed 10:00 CET
    expect(slotFor(new Date("2026-11-05T09:00:00Z"))).toBe("send"); // Thu 10:00 CET
    expect(slotFor(new Date("2026-11-05T08:00:00Z"))).toBeNull(); // Thu 09:00 CET
    expect(slotFor(new Date("2026-10-22T08:00:00Z"))).toBe("send"); // Thu 10:00 CEST
    expect(slotFor(new Date("2026-11-06T09:00:00Z"))).toBeNull(); // Friday
  });

  it("builds an email with only own links and an unsubscribe link", () => {
    const html = emailHtml({ slug: "2026-week-45", title_nl: "Vijf <makers>", intro_nl: "Intro", body_md: "[Shop](/webshop/a) [x](https://evil.example)" });
    expect(html).toContain("<h1>Vijf &lt;makers&gt;</h1>");
    expect(html).toContain('href="https://dewebshopgids.nl/webshop/a"');
    expect(html).not.toContain("evil.example");
    expect(html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
    expect(html).toContain("https://dewebshopgids.nl/gids/2026-week-45");
  });
});

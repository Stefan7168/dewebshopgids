import { describe, expect, it } from "vitest";
import { scoreDisplay } from "@/lib/shops/present";
import { MemoryLimiter, confirmRemovalEmail, confirmationRecipient, disputableStatus, isOnShopDomain, needsConfirmation, parseDisputeType } from "./core";

describe("dispute helpers", () => {
  it("accepts only the three form types", () => {
    expect(parseDisputeType("removal")).toBe("removal");
    expect(parseDisputeType("prenotice")).toBeNull();
    expect(parseDisputeType("toString")).toBeNull();
    expect(needsConfirmation("objection")).toBe(true);
    expect(needsConfirmation("correction")).toBe(false);
  });

  it("matches the shop domain on the parsed host, not a substring", () => {
    expect(isOnShopDomain("info@mooiehuis.nl", "mooiehuis.nl")).toBe(true);
    expect(isOnShopDomain("info@mail.mooiehuis.nl", "mooiehuis.nl")).toBe(true);
    expect(isOnShopDomain("x@nietmooiehuis.nl", "mooiehuis.nl")).toBe(false);
    expect(isOnShopDomain("mooiehuis.nl@evil.test", "mooiehuis.nl")).toBe(false);
    expect(isOnShopDomain("x@mooiehuis.nl.evil.test", "mooiehuis.nl")).toBe(false);
  });

  it("sends the link to the known role address first, then to a submitted address on the domain, else nobody", () => {
    expect(confirmationRecipient("info@mooiehuis.nl", "a@gmail.com", "mooiehuis.nl")).toBe("info@mooiehuis.nl");
    expect(confirmationRecipient(null, "eigenaar@mooiehuis.nl", "mooiehuis.nl")).toBe("eigenaar@mooiehuis.nl");
    expect(confirmationRecipient(null, "a@gmail.com", "mooiehuis.nl")).toBeNull();
    expect(confirmationRecipient("info@other.nl", "a@gmail.com", "mooiehuis.nl")).toBeNull();
  });

  it("only lets visitors dispute shops that have or will get a page", () => {
    expect(["published", "prenotified", "disputed"].every(disputableStatus)).toBe(true);
    expect(["draft", "hidden", "removed"].some(disputableStatus)).toBe(false);
  });

  it("puts the token in the confirmation link", () => {
    const m = confirmRemovalEmail("Mooie Huis", "removal", "tok");
    expect(m.text).toContain("/herbeoordeling/bevestig?t=tok");
    expect(m.text).not.toMatch(/onbetrouwbaar|review/i);
  });

  it("shows a disputed shop as In beoordeling", () => {
    expect(scoreDisplay({ score: 80, score_label: null, status: "disputed" }).kind).toBe("pending");
    expect(scoreDisplay({ score: 80, score_label: null, status: "published" }).kind).toBe("number");
  });

  it("limits per key within the window", () => {
    const l = new MemoryLimiter(2, 1000);
    expect(l.allow("a", 0)).toBe(true);
    expect(l.allow("a", 1)).toBe(true);
    expect(l.allow("a", 2)).toBe(false);
    expect(l.allow("b", 2)).toBe(true);
    expect(l.allow("a", 1001)).toBe(true);
  });
});

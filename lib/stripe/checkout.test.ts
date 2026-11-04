import { describe, expect, it, vi } from "vitest";
import { createBadgeCheckout, idempotencyKey } from "./checkout";

const config = { secretKey: "sk_test_x", prices: { month: "price_m", year: "price_y" } };

describe("createBadgeCheckout", () => {
  it("sends one idempotency key per shop, plan and day, so a double click reuses the session", async () => {
    const now = new Date("2026-10-29T10:00:00Z");
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_1" })));
    const url = await createBadgeCheckout("shop-1", "year", config, "https://dewebshopgids.nl", fetchImpl as typeof fetch, now);
    expect(url).toBe("https://checkout.stripe.com/c/pay/cs_1");
    const headers = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers["idempotency-key"]).toBe("badge-shop-1-year-2026-10-29");
    expect(idempotencyKey("shop-1", "month", now)).not.toBe(idempotencyKey("shop-1", "year", now));
    expect(idempotencyKey("shop-1", "year", new Date("2026-10-30T10:00:00Z"))).not.toBe(headers["idempotency-key"]);
  });
  it("returns null when Stripe refuses or answers with a foreign URL", async () => {
    const refused = vi.fn(async () => new Response("{}", { status: 400 }));
    expect(await createBadgeCheckout("s", "month", config, "https://x", refused as typeof fetch)).toBeNull();
    const foreign = vi.fn(async () => new Response(JSON.stringify({ url: "https://evil.example/" })));
    expect(await createBadgeCheckout("s", "month", config, "https://x", foreign as typeof fetch)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { badgePriceText, BADGE_PLANS, checkoutConfig, yearlySavingMonths } from "./pricing";
import { checkoutForm, createBadgeCheckout } from "@/lib/stripe/checkout";

const env = { STRIPE_SECRET_KEY: "sk_test_abc", STRIPE_PRICE_BADGE_MONTH: "price_m", STRIPE_PRICE_BADGE_YEAR: "price_y" };

describe("badge pricing", () => {
  it("states both plans", () => {
    expect(BADGE_PLANS.map((p) => p.eur)).toEqual([15, 149]);
    expect(badgePriceText()).toBe("€ 15 per maand of € 149 per jaar");
    expect(yearlySavingMonths()).toBe(2);
  });

  it("is off until the key and both prices are set", () => {
    expect(checkoutConfig({})).toBeNull();
    expect(checkoutConfig({ ...env, STRIPE_PRICE_BADGE_YEAR: "" })).toBeNull();
    expect(checkoutConfig({ ...env, STRIPE_SECRET_KEY: "pk_test_abc" })).toBeNull();
    expect(checkoutConfig(env)).toEqual({ secretKey: "sk_test_abc", prices: { month: "price_m", year: "price_y" } });
  });
});

describe("badge checkout", () => {
  const config = checkoutConfig(env)!;
  const shopId = "8f0e0d1c-1111-4222-8333-444455556666";

  it("sends the shop id as client_reference_id with the chosen price", () => {
    const f = checkoutForm(shopId, "year", config, "https://dewebshopgids.nl");
    expect(f.get("mode")).toBe("subscription");
    expect(f.get("line_items[0][price]")).toBe("price_y");
    expect(f.get("client_reference_id")).toBe(shopId);
    expect(f.get("metadata[product]")).toBe("badge");
    expect(f.get("success_url")).toBe("https://dewebshopgids.nl/geverifieerd?betaald=1");
  });

  it("returns only a Stripe checkout URL", async () => {
    const calls: [string, RequestInit][] = [];
    const ok = (async (u: string, i: RequestInit) => {
      calls.push([u, i]);
      return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_1" }));
    }) as unknown as typeof fetch;
    expect(await createBadgeCheckout(shopId, "month", config, "https://x.nl", ok)).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
    expect((calls[0][1].headers as Record<string, string>).authorization).toBe("Bearer sk_test_abc");

    const odd = (async () => new Response(JSON.stringify({ url: "https://evil.example/" }))) as unknown as typeof fetch;
    expect(await createBadgeCheckout(shopId, "month", config, "https://x.nl", odd)).toBeNull();
    const refused = (async () => new Response("{}", { status: 400 })) as unknown as typeof fetch;
    expect(await createBadgeCheckout(shopId, "month", config, "https://x.nl", refused)).toBeNull();
  });
});

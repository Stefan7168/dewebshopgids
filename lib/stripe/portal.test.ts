import { describe, expect, it, vi } from "vitest";
import { createPortalSession } from "./portal";

const ok = (body: unknown) => new Response(JSON.stringify(body));

describe("createPortalSession", () => {
  it("looks up the customer of the subscription and opens a Dutch portal for them", async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.endsWith("/subscriptions/sub_1") ? ok({ customer: "cus_9" }) : ok({ url: "https://billing.stripe.com/p/session/x" }),
    );
    const url = await createPortalSession("sub_1", "sk_test_x", "https://dewebshopgids.nl/geverifieerd", fetchImpl as unknown as typeof fetch);
    expect(url).toBe("https://billing.stripe.com/p/session/x");
    const [, init] = fetchImpl.mock.calls[1] as unknown as [string, RequestInit];
    const body = new URLSearchParams(init.body as URLSearchParams);
    expect(body.get("customer")).toBe("cus_9");
    expect(body.get("locale")).toBe("nl");
  });
  it("returns null for a bad id, a Stripe refusal or a foreign URL", async () => {
    const never = vi.fn();
    expect(await createPortalSession("sub_1/../x", "sk", "https://x", never as unknown as typeof fetch)).toBeNull();
    expect(never).not.toHaveBeenCalled();
    const refused = vi.fn(async () => new Response("{}", { status: 404 }));
    expect(await createPortalSession("sub_1", "sk", "https://x", refused as unknown as typeof fetch)).toBeNull();
    const foreign = vi.fn(async (url: string) => (url.includes("/subscriptions/") ? ok({ customer: "cus_9" }) : ok({ url: "https://evil.example/" })));
    expect(await createPortalSession("sub_1", "sk", "https://x", foreign as unknown as typeof fetch)).toBeNull();
  });
});

// Stripe webhook for the "Geverifieerd" badge and the "Uitgelicht" placement (plan v3 sections 10, 12 and 15). No Stripe SDK: the
// signature check follows Stripe's manual verification (HMAC-SHA256 over "{t}.{raw body}" with the
// endpoint secret, any v1 may match during secret rotation, 5 minute tolerance), and only the few
// fields below are read. Invoices use the 2025-03-31 "basil" shape (`parent.subscription_details`)
// with a fallback to the older top-level `subscription`.
import { createHmac, timingSafeEqual } from "node:crypto";

export const TOLERANCE_SECONDS = 300;
/** Days of badge after the paid period ends, so a late renewal does not flicker the badge off. */
export const GRACE_DAYS = 3;

export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.split("=", 2) as [string, string]);
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isInteger(t) || !sigs.length || Math.abs(nowSeconds - t) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  return sigs.some((s) => {
    const got = Buffer.from(s);
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

export type BadgeAction =
  | { kind: "link"; product: Product; shopId: string; subscriptionId: string; until: string }
  | { kind: "extend"; subscriptionId: string; until: string }
  | { kind: "end"; subscriptionId: string }
  | { kind: "ignore"; reason: string };

/** Which Payment Link was paid: the Uitgelicht link carries metadata product=uitgelicht; anything else is the badge. */
export type Product = "badge" | "uitgelicht";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const idOf = (v: unknown): string | null => (typeof v === "string" ? v : typeof obj(v).id === "string" ? (obj(v).id as string) : null);

function dateAfter(unixSeconds: number, days: number): string {
  return new Date((unixSeconds + days * 86400) * 1000).toISOString().slice(0, 10);
}

/** Subscription states in which the badge (or placement) stops at once. */
export const ENDED_STATUSES = ["canceled", "unpaid", "incomplete_expired"];

/**
 * What a verified event means for a badge or placement. Everything else is ignored.
 *
 * | Event                              | Condition                                   | Result                          |
 * |------------------------------------|---------------------------------------------|---------------------------------|
 * | checkout.session.completed         | paid subscription, shop id in reference     | link, about one month           |
 * | invoice.paid                       | has a subscription and a period             | extend to period end + 3 days   |
 * | invoice.payment_failed             | Stripe will retry (next_payment_attempt)    | ignore: the paid period runs on |
 * | invoice.payment_failed             | no retry left (next_payment_attempt null)   | end                             |
 * | customer.subscription.updated      | status canceled, unpaid, incomplete_expired | end                             |
 * | customer.subscription.updated      | active, past_due, cancel_at_period_end      | ignore: the stored date decides |
 * | customer.subscription.deleted      | always                                      | end                             |
 *
 * A badge that is not extended switches itself off when `verified_badge_until` passes, monthly or yearly.
 */
export function badgeAction(event: unknown, nowSeconds = Math.floor(Date.now() / 1000)): BadgeAction {
  const e = obj(event);
  const o = obj(obj(e.data).object);
  switch (e.type) {
    case "checkout.session.completed": {
      const shopId = o.client_reference_id;
      const sub = idOf(o.subscription);
      if (o.mode !== "subscription" || typeof shopId !== "string" || !UUID.test(shopId) || !sub) return { kind: "ignore", reason: "not a badge checkout" };
      if (o.payment_status !== "paid") return { kind: "ignore", reason: "checkout not paid" };
      // The first invoice.paid sets the exact period; until then about one month.
      const product: Product = obj(o.metadata).product === "uitgelicht" ? "uitgelicht" : "badge";
      return { kind: "link", product, shopId, subscriptionId: sub, until: dateAfter(nowSeconds, 31 + GRACE_DAYS) };
    }
    case "invoice.paid": {
      const parent = obj(o.parent);
      const sub = idOf(parent.type === "subscription_details" ? obj(parent.subscription_details).subscription : o.subscription);
      if (!sub) return { kind: "ignore", reason: "invoice without subscription" };
      const ends = (obj(o.lines).data as unknown[] | undefined ?? []).map((l) => Number(obj(obj(l).period).end)).filter(Number.isFinite);
      const end = ends.length ? Math.max(...ends) : Number(o.period_end);
      if (!Number.isFinite(end)) return { kind: "ignore", reason: "invoice without period" };
      return { kind: "extend", subscriptionId: sub, until: dateAfter(end, GRACE_DAYS) };
    }
    case "invoice.payment_failed": {
      const parent = obj(o.parent);
      const sub = idOf(parent.type === "subscription_details" ? obj(parent.subscription_details).subscription : o.subscription);
      if (!sub) return { kind: "ignore", reason: "invoice without subscription" };
      // Stripe sets next_payment_attempt to null after its last retry. Until then the paid period runs on.
      if (o.next_payment_attempt !== null) return { kind: "ignore", reason: "payment failed, Stripe retries" };
      return { kind: "end", subscriptionId: sub };
    }
    case "customer.subscription.updated": {
      const sub = idOf(o.id);
      if (!sub) return { kind: "ignore", reason: "no subscription id" };
      return ENDED_STATUSES.includes(String(o.status)) ? { kind: "end", subscriptionId: sub } : { kind: "ignore", reason: `subscription ${String(o.status)}` };
    }
    case "customer.subscription.deleted": {
      const sub = idOf(o.id);
      return sub ? { kind: "end", subscriptionId: sub } : { kind: "ignore", reason: "no subscription id" };
    }
    default:
      return { kind: "ignore", reason: `event ${String(e.type)} not used` };
  }
}

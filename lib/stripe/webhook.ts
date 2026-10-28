// Stripe webhook for the "Geverifieerd" badge (plan v3 sections 10 and 15). No Stripe SDK: the
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
  | { kind: "link"; shopId: string; subscriptionId: string; until: string }
  | { kind: "extend"; subscriptionId: string; until: string }
  | { kind: "end"; subscriptionId: string }
  | { kind: "ignore"; reason: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const idOf = (v: unknown): string | null => (typeof v === "string" ? v : typeof obj(v).id === "string" ? (obj(v).id as string) : null);

function dateAfter(unixSeconds: number, days: number): string {
  return new Date((unixSeconds + days * 86400) * 1000).toISOString().slice(0, 10);
}

/** What a verified event means for the badge. Everything else is ignored. */
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
      return { kind: "link", shopId, subscriptionId: sub, until: dateAfter(nowSeconds, 31 + GRACE_DAYS) };
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
    case "customer.subscription.deleted": {
      const sub = idOf(o.id);
      return sub ? { kind: "end", subscriptionId: sub } : { kind: "ignore", reason: "no subscription id" };
    }
    default:
      return { kind: "ignore", reason: `event ${String(e.type)} not used` };
  }
}

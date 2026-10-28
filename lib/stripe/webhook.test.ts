import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { badgeAction, verifyStripeSignature } from "./webhook";

const secret = "whsec_test";
const sign = (body: string, t: number, key = secret) => createHmac("sha256", key).update(`${t}.${body}`).digest("hex");
const shopId = "00000000-0000-4000-8000-0000000000a1";
const now = 1_793_000_000;

describe("verifyStripeSignature", () => {
  const body = '{"id":"evt_1"}';
  it("accepts a fresh signature, also when one of several v1 values matches", () => {
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(body, now)}`, secret, now)).toBe(true);
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(body, now, "old")},v1=${sign(body, now)}`, secret, now)).toBe(true);
  });
  it("rejects a changed body, a wrong secret, an old timestamp and a missing header", () => {
    expect(verifyStripeSignature(`${body} `, `t=${now},v1=${sign(body, now)}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(body, now, "x")}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(body, `t=${now - 301},v1=${sign(body, now - 301)}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(body, null, secret, now)).toBe(false);
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(body, now)}`, "", now)).toBe(false);
  });
});

describe("badgeAction", () => {
  it("links a paid subscription checkout to the shop in client_reference_id", () => {
    const a = badgeAction({ type: "checkout.session.completed", data: { object: { mode: "subscription", payment_status: "paid", client_reference_id: shopId, subscription: "sub_1" } } }, now);
    expect(a).toMatchObject({ kind: "link", shopId, subscriptionId: "sub_1" });
    expect(badgeAction({ type: "checkout.session.completed", data: { object: { mode: "subscription", payment_status: "paid", client_reference_id: "x'; drop", subscription: "sub_1" } } }).kind).toBe("ignore");
    expect(badgeAction({ type: "checkout.session.completed", data: { object: { mode: "subscription", payment_status: "unpaid", client_reference_id: shopId, subscription: "sub_1" } } }).kind).toBe("ignore");
  });

  it("extends to the paid period end plus grace, for basil and older invoices", () => {
    const end = Date.UTC(2026, 11, 1) / 1000;
    const basil = { type: "invoice.paid", data: { object: { parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } }, lines: { data: [{ period: { end } }] } } } };
    expect(badgeAction(basil)).toEqual({ kind: "extend", subscriptionId: "sub_1", until: "2026-12-04" });
    const old = { type: "invoice.paid", data: { object: { subscription: "sub_2", period_end: end, lines: { data: [] } } } };
    expect(badgeAction(old)).toEqual({ kind: "extend", subscriptionId: "sub_2", until: "2026-12-04" });
  });

  it("ends the badge when the subscription is deleted and ignores other events", () => {
    expect(badgeAction({ type: "customer.subscription.deleted", data: { object: { id: "sub_1" } } })).toEqual({ kind: "end", subscriptionId: "sub_1" });
    expect(badgeAction({ type: "charge.refunded", data: { object: {} } }).kind).toBe("ignore");
  });
});

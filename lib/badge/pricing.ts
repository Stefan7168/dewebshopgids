// Prices for what shops can pay for (revenue model v2, 2026-10-29). Pages, llms.txt, the Outreach
// check and the checkout read them from here; change a price here and nowhere else. None of them
// changes score or order (plan v3 section 10).

export type BadgePlan = {
  key: "month" | "year";
  eur: number;
  label: string;
  /** Env var with the Stripe price ID (price_...) for this plan. */
  priceEnv: "STRIPE_PRICE_BADGE_MONTH" | "STRIPE_PRICE_BADGE_YEAR";
};

export const BADGE_PLANS: readonly BadgePlan[] = [
  { key: "month", eur: 15, label: "per maand", priceEnv: "STRIPE_PRICE_BADGE_MONTH" },
  { key: "year", eur: 149, label: "per jaar", priceEnv: "STRIPE_PRICE_BADGE_YEAR" },
];

/** Only shops at or above this score can buy the badge or be offered it. */
export const BADGE_MIN_SCORE = 70;

export const UITGELICHT_EUR = 49;

export const formatEur = (eur: number) => `€ ${eur}`;

/** "€ 15 per maand of € 149 per jaar" */
export const badgePriceText = () => BADGE_PLANS.map((p) => `${formatEur(p.eur)} ${p.label}`).join(" of ");

/** Months the yearly plan saves compared with paying monthly, rounded down. */
export function yearlySavingMonths(): number {
  const [m, y] = [BADGE_PLANS.find((p) => p.key === "month")!, BADGE_PLANS.find((p) => p.key === "year")!];
  return Math.floor((m.eur * 12 - y.eur) / m.eur);
}

export type CheckoutConfig = { secretKey: string; prices: Record<BadgePlan["key"], string> };

/** Checkout is live only when the secret key and both price IDs are set; otherwise pages show "binnenkort". */
export function checkoutConfig(env: Record<string, string | undefined> = process.env): CheckoutConfig | null {
  const secretKey = env.STRIPE_SECRET_KEY ?? "";
  const month = env.STRIPE_PRICE_BADGE_MONTH ?? "";
  const year = env.STRIPE_PRICE_BADGE_YEAR ?? "";
  if (!/^(sk|rk)_(live|test)_/.test(secretKey) || !month.startsWith("price_") || !year.startsWith("price_")) return null;
  return { secretKey, prices: { month, year } };
}

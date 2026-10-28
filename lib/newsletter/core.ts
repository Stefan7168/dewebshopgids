// Newsletter double opt-in (plan v3 sections 6 and 10). Pure helpers, unit tested.
// The email address lives only in Resend; we keep a hash of a random token per subscriber.
import { createHash, randomBytes } from "node:crypto";
import { rankShops, scoreDisplay, type PublicShop } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

/** Until the first guide (plan week 13) the form promises a start month. Set to null once guides go out. */
export const GUIDE_START_MONTH: string | null = "februari";

export const CONFIRM_VALID_DAYS = 7;
/** One confirmation email per address per day, so the form cannot be used to flood an inbox. */
export const RESEND_CONFIRM_AFTER_HOURS = 24;

export function signupHeadline(startMonth = GUIDE_START_MONTH): string {
  const base = "Elke week 5 unieke woonwinkels in je inbox";
  return startMonth ? `Vanaf ${startMonth}: ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
}

export function normaliseEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const e = input.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@<>()"',;:]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e)) return null;
  return e;
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isTokenShape(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);
}

export function olderThan(iso: string, hours: number, now = new Date()): boolean {
  return now.getTime() - new Date(iso).getTime() > hours * 3_600_000;
}

export function confirmEmail(token: string): { subject: string; text: string } {
  return {
    subject: "Bevestig je inschrijving bij De Webshopgids",
    text: [
      "Hoi,",
      "",
      "Je hebt je aangemeld voor de nieuwsbrief van De Webshopgids. Bevestig dat via deze link:",
      `${SITE.url}/nieuwsbrief/bevestig?t=${token}`,
      "",
      `De link werkt ${CONFIRM_VALID_DAYS} dagen. Heb je je niet aangemeld? Dan hoef je niets te doen; je krijgt geen mail meer van ons.`,
      "",
      `${SITE.name} · ${SITE.email}`,
    ].join("\n"),
  };
}

/** Most clicked published shops in the last 30 days, topped up by score. Links go to our own pages only. */
export function welcomeShops(shops: PublicShop[], clickedShopIds: string[], n = 5): PublicShop[] {
  const counts = new Map<string, number>();
  for (const id of clickedShopIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const byClicks = shops.filter((s) => counts.has(s.id)).sort((a, b) => counts.get(b.id)! - counts.get(a.id)! || a.name.localeCompare(b.name, "nl"));
  const picked = byClicks.slice(0, n);
  for (const s of rankShops(shops)) {
    if (picked.length >= n) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked;
}

/** Lead magnet (plan v3 section 11): "De 25 meest authentieke woonwebshops van Nederland". */
export const LEAD_MAGNET_SIZE = 25;
export const LEAD_MAGNET_TITLE = "De 25 meest authentieke woonwebshops van Nederland";

/** The 25 published shops with the highest numeric score; empty until 25 qualify, so the promise is never half kept. */
export function leadMagnetShops(shops: PublicShop[]): PublicShop[] {
  const scored = rankShops(shops.filter((s) => scoreDisplay(s).kind === "number"));
  return scored.length >= LEAD_MAGNET_SIZE ? scored.slice(0, LEAD_MAGNET_SIZE) : [];
}

export function welcomeEmail(shops: PublicShop[], token: string, magnet: PublicShop[] = []): { subject: string; text: string } {
  const list = magnet.length
    ? [
        LEAD_MAGNET_TITLE,
        // Ranking disclosure directly above the list (art. 6:193e BW); no paid entries.
        "Hoe is deze volgorde bepaald? Alleen door de echtheidsscore (1 tot 100). Betalen voor een plek kan niet.",
        "",
        ...magnet.map((s, i) => `${i + 1}. ${s.name} (score ${s.score}): ${SITE.url}/webshop/${s.slug}`),
        "",
      ]
    : [];
  const lines = [
    "Welkom bij De Webshopgids!",
    "",
    ...list,
    signupHeadline() + ". Om alvast te beginnen: deze woonwinkels worden nu het meest bekeken.",
    "",
    ...shops.map((s, i) => `${i + 1}. ${s.name}: ${SITE.url}/webshop/${s.slug}`),
    "",
    "Bij elke webshop zie je hoe lang hij online is, welk keurmerk hij echt heeft en waar de echtheidsscore vandaan komt.",
    "",
    `Afmelden kan altijd: ${SITE.url}/nieuwsbrief/afmelden?t=${token}`,
    "",
    `${SITE.name} · ${SITE.email}`,
  ];
  return { subject: "Welkom bij De Webshopgids", text: lines.join("\n") };
}

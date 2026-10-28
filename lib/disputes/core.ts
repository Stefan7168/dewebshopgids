// Dispute and objection form (plan v3 section 7, step 9). Pure helpers, unit tested.
// Only instant effect of a submission: the shop reads "In beoordeling". Removal needs a
// click on a link sent to an address on the shop's own domain, so a competitor cannot take a shop offline.
import { SITE } from "@/lib/site";

export const DISPUTE_TYPES = {
  correction: "Er klopt iets niet (feit of score)",
  removal: "Verwijder deze webshop van de site",
  objection: "Bezwaar tegen het gebruik van gegevens (AVG art. 21)",
} as const;
export type FormDisputeType = keyof typeof DISPUTE_TYPES;

export const CONFIRM_VALID_DAYS = 7;
/** Removal must be done within 48 hours after confirmation; the hourly job enforces it. */
export const REMOVAL_DEADLINE_HOURS = 48;
/** The Dispute Handler answers a correction within 7 days. */
export const ANSWER_DAYS = 7;
export const MAX_MESSAGE = 5000;
/** Limits per shop and site-wide, counted in the database. */
export const PER_SHOP_PER_DAY = 3;
export const SITE_WIDE_PER_HOUR = 30;
/** Per sender, counted in memory only: we store no IP address. */
export const PER_SENDER_PER_HOUR = 5;

export function parseDisputeType(v: unknown): FormDisputeType | null {
  return typeof v === "string" && Object.hasOwn(DISPUTE_TYPES, v) ? (v as FormDisputeType) : null;
}

export function needsConfirmation(type: FormDisputeType): type is "removal" | "objection" {
  return type === "removal" || type === "objection";
}

/** Statuses a visitor can dispute. A removed, hidden or draft shop has no page to dispute. */
export function disputableStatus(status: string): boolean {
  return status === "published" || status === "prenotified" || status === "disputed";
}

/** The address is on the shop's domain or one of its subdomains. Compared on the parsed domain, not a substring. */
export function isOnShopDomain(email: string, shopDomain: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const host = email.slice(at + 1).toLowerCase();
  const d = shopDomain.toLowerCase();
  return host === d || host.endsWith(`.${d}`);
}

/**
 * Where the confirmation link goes: the role address we found on the shop's site, or else the
 * submitted address when it is on the shop's domain. Null means a person has to check.
 */
export function confirmationRecipient(contactEmail: string | null, submitted: string, shopDomain: string): string | null {
  if (contactEmail && isOnShopDomain(contactEmail, shopDomain)) return contactEmail;
  return isOnShopDomain(submitted, shopDomain) ? submitted : null;
}

export function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 3_600_000);
}

type Msg = { subject: string; text: string };

const KIND: Record<"removal" | "objection", string> = {
  removal: "een verzoek om {shop} van De Webshopgids te verwijderen",
  objection: "bezwaar tegen het gebruik van de gegevens van {shop} op De Webshopgids",
};

export function confirmRemovalEmail(shopName: string, type: "removal" | "objection", token: string): Msg {
  return {
    subject: `Bevestig je verzoek over ${shopName}`,
    text: [
      "Hoi,",
      "",
      `Via ons formulier is ${KIND[type].replace("{shop}", shopName)} ingediend. We sturen deze mail naar een adres op het domein van de webshop, zodat we weten dat het verzoek van de webshop zelf komt.`,
      "",
      "Klopt dit? Bevestig het via deze link:",
      `${SITE.url}/herbeoordeling/bevestig?t=${token}`,
      "",
      `Na je bevestiging halen we de pagina direct offline. De link werkt ${CONFIRM_VALID_DAYS} dagen. Heb je niets ingediend? Dan hoef je niets te doen.`,
      "",
      `${SITE.name} · ${SITE.email}`,
    ].join("\n"),
  };
}

export function removedEmail(shopName: string): Msg {
  return {
    subject: `${shopName} staat niet meer op De Webshopgids`,
    text: [
      "Hoi,",
      "",
      `We hebben je verzoek uitgevoerd: de pagina van ${shopName} is offline en we verwerken de gegevens van de webshop niet meer voor de site.`,
      "",
      `Was dit een vergissing? Mail ons op ${SITE.email}.`,
      "",
      `${SITE.name} · ${SITE.email}`,
    ].join("\n"),
  };
}

/** Fixed-window counter in memory. Resets when the server instance restarts; the database limits are the backstop. */
export class MemoryLimiter {
  private hits = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.hits.clear(); // bound memory
    return true;
  }
}

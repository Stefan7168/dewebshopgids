// Shop claiming v1 (plan v3 section 12): a shop proves it controls an address on its own domain,
// then proposes its own description. A person approves it in /admin. Pure rules, unit tested.
import { unsafeText } from "../disputes/replies";
import { SITE } from "../site";

export const CLAIM_VALID_DAYS = 7;
export const CLAIM_PER_SENDER_PER_HOUR = 5;
export const CLAIM_PER_SHOP_PER_DAY = 3;
export const CLAIM_SITE_WIDE_PER_HOUR = 30;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 600;
/** A shop page must exist or be about to: removed shops cannot be claimed. */
export const CLAIMABLE_STATUSES = ["published", "prenotified", "disputed"];

export function normaliseDescription(input: unknown): string {
  return typeof input === "string" ? input.replace(/\s+/g, " ").trim() : "";
}

/** Null when the text may go to review; otherwise a Dutch reason for the sender. */
export function descriptionProblem(text: string): string | null {
  if (text.length < DESCRIPTION_MIN) return `Schrijf minstens ${DESCRIPTION_MIN} tekens.`;
  if (text.length > DESCRIPTION_MAX) return `Gebruik maximaal ${DESCRIPTION_MAX} tekens.`;
  if (/(\+31|\b0)[\s-]?[1-9](?:[\s-]?\d){7,8}\b/.test(text)) return "Laat telefoonnummers weg; die staan op je eigen site.";
  const unsafe = unsafeText(text);
  if (unsafe === "an email address") return "Laat e-mailadressen weg; die staan op je eigen site.";
  if (unsafe?.startsWith("a link or domain")) return "Laat links weg; de knop naar je webshop staat al op de pagina.";
  if (unsafe === 'the word "review"' || unsafe === 'the word "onbetrouwbaar"') return "Beschrijf je eigen winkel en producten, zonder beoordelingen.";
  if (unsafe) return "Deze tekst kunnen we niet gebruiken. Beschrijf in gewone zinnen wat je maakt of verkoopt.";
  return null;
}

export function claimEmail(shopName: string, token: string): { subject: string; text: string } {
  return {
    subject: `Je beschrijving van ${shopName} aanpassen`,
    text: [
      "Hallo,",
      "",
      `Via De Webshopgids is gevraagd om de beschrijving van ${shopName} te mogen aanpassen. Was jij dat? Open dan deze link (${CLAIM_VALID_DAYS} dagen geldig):`,
      "",
      `${SITE.url}/beheer/bewerk?t=${token}`,
      "",
      "Je nieuwe tekst bekijken we eerst; daarna staat hij op de pagina van je webshop. De score verandert er niet door.",
      "",
      "Was jij dit niet? Dan hoef je niets te doen.",
      "",
      "De Webshopgids",
    ].join("\n"),
  };
}

// The pre-notice email (plan v3 section 7, step 8): sent 7 days before a shop's page goes
// live, to the shop's role address. Serves as the GDPR notice and the first contact.
// Slots are filled by code from our own data; the sender resolves the address from the
// `prenotice` disputes row.
import { SITE } from "../site";

export type PrenoticeSlots = {
  shop_name: string;
  shop_slug: string;
  publish_on: string; // ISO timestamp
  score_text: string;
  keurmerk_text: string;
  online_since: string | null;
  products_text: string | null;
};

function text(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() && v.length <= max && !/[\r\n]/.test(v) ? v.trim() : null;
}

export function renderPrenotice(s: Record<string, unknown>): { subject: string; text: string } | null {
  const name = text(s.shop_name, 200);
  const slug = typeof s.shop_slug === "string" && /^[a-z0-9-]{1,100}$/.test(s.shop_slug) ? s.shop_slug : null;
  const score = text(s.score_text, 80);
  const keurmerk = text(s.keurmerk_text, 200);
  const when = typeof s.publish_on === "string" && !Number.isNaN(Date.parse(s.publish_on)) ? new Date(s.publish_on) : null;
  if (!name || !slug || !score || !keurmerk || !when) return null;
  const date = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "long" }).format(when);
  const facts = [
    `- Echtheidsscore: ${score}`,
    `- Keurmerk: ${keurmerk}`,
    text(s.online_since, 10) ? `- Online sinds: ongeveer ${s.online_since}` : null,
    text(s.products_text, 80) ? `- Assortiment: ${s.products_text}` : null,
  ].filter((l): l is string => l !== null);
  return {
    subject: `${name} komt in De Webshopgids`,
    text: [
      "Hoi,",
      "",
      `We nemen ${name} op in ${SITE.name}, een onafhankelijke gids met unieke Nederlandse webshops. Opname is gratis. Vanaf ${date} staat je webshop op ${SITE.url}/webshop/${slug}`,
      "",
      "Dit tonen we op die pagina:",
      ...facts,
      "",
      `We gebruiken alleen wat op je eigen site en in openbare bronnen staat. Hoe de score werkt: ${SITE.url}/hoe-wij-beoordelen`,
      `Welke gegevens we bewaren en welke rechten je hebt: ${SITE.url}/informatie-voor-webshops`,
      "",
      `Klopt er iets niet, of wil je liever niet in de gids? Laat het ons weten via ${SITE.url}/herbeoordeling?shop=${slug}`,
      "Je hoeft verder niets te doen.",
      "",
      `${SITE.name} · ${SITE.email}`,
    ].join("\n"),
  };
}

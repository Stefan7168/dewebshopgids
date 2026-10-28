// email_queue templates (plan v3 section 7). Plain-text Dutch emails built from typed slots.
// The sender sends only templates listed here; agents can queue rows but never choose the text.
import { REPLY_TEMPLATE_IDS, renderReply, validateReplySlots } from "../disputes/replies";
import { badgeEmbed } from "../badge/svg";
import { renderOutreach } from "../outreach/check";
import { SITE } from "../site";
import { renderPrenotice } from "./prenotice";

export type Rendered = { subject: string; text: string };
type Slots = Record<string, unknown>;
// "dispute": `to` is `dispute:<id>` and the sender resolves the address from that disputes row.
// "shop": `shop_id` is set and the sender resolves shops.contact_email; `marketing` mail is skipped for opted-out shops.
type Template =
  | { recipient: "owner" | "shop" | "dispute"; marketing?: boolean; render: (slots: Slots) => Rendered | null }
  | { recipient: "internal" };

function str(v: unknown, max = 500): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function amsterdam(iso: unknown): string {
  if (typeof iso !== "string" || Number.isNaN(Date.parse(iso))) return "onbekend";
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short", hourCycle: "h23" }).format(new Date(iso));
}

export const TEMPLATES: Record<string, Template> = {
  ops_gap_alert: {
    recipient: "owner",
    render: (s) => {
      const agent = str(s.agent, 60);
      if (!agent) return null;
      return {
        subject: `Agent ${agent} draait niet op schema`,
        text: [
          `De agent of job "${agent}" is niet gestart binnen het verwachte schema.`,
          `Laatste start: ${s.last_run ? amsterdam(s.last_run) : "nooit"}.`,
          "",
          "Kijk in /admin/agents of in GitHub Actions wat er misgaat. Je krijgt hooguit één melding per agent per 24 uur.",
        ].join("\n"),
      };
    },
  },
  ops_pause_alert: {
    recipient: "owner",
    render: (s) => {
      const agent = str(s.agent, 60);
      if (!agent) return null;
      return {
        subject: `Ops Watchdog heeft ${agent} gepauzeerd`,
        text: [
          `De Ops Watchdog heeft "${agent}" gepauzeerd tot ${amsterdam(s.paused_until)}.`,
          // Agent text: shown as quoted plain text, never as instructions.
          `Reden volgens de Watchdog: "${str(s.reason, 1000) ?? "geen reden opgegeven"}"`,
          "",
          "Na afloop zet de health job de agent zelf weer aan. Eerder aanzetten kan in /admin/agents.",
        ].join("\n"),
      };
    },
  },
  weekly_digest: {
    recipient: "owner",
    render: (s) => {
      const week = str(s.week, 20);
      const body = str(s.body, 60_000);
      if (!week || !body) return null;
      return { subject: `Weekoverzicht De Webshopgids ${week}`, text: body };
    },
  },
  // Badge offer approved by Stefan in /admin/outreach (G3). Slots: { subject, body, shop_id, shop_slug }
  // copied from the checked outreach draft. The payment link is the fixed Stripe Payment Link from
  // STRIPE_BADGE_LINK with the shop id as client_reference_id; without it the row waits.
  outreach_badge: {
    recipient: "shop",
    marketing: true,
    render: (s) => {
      const subject = str(s.subject, 150);
      const body = str(s.body, 5000);
      const id = typeof s.shop_id === "string" && /^[0-9a-f-]{36}$/.test(s.shop_id) ? s.shop_id : null;
      const slug = typeof s.shop_slug === "string" && /^[a-z0-9-]{1,100}$/.test(s.shop_slug) ? s.shop_slug : null;
      const link = process.env.STRIPE_BADGE_LINK;
      if (!subject || !body || !id || !slug || !link?.startsWith("https://")) return null;
      const pay = `${link}${link.includes("?") ? "&" : "?"}client_reference_id=${id}`;
      return { subject, text: renderOutreach(body, { pay, shopPage: `${SITE.url}/webshop/${slug}` }) };
    },
  },
  // Monthly report to a paying badge shop (scripts/badge/report.ts). Service mail, not marketing.
  badge_click_report: {
    recipient: "shop",
    render: (s) => {
      const name = str(s.shop_name, 200);
      const slug = typeof s.shop_slug === "string" && /^[a-z0-9-]{1,100}$/.test(s.shop_slug) ? s.shop_slug : null;
      const month = typeof s.month === "string" && /^\d{4}-\d{2}$/.test(s.month) ? s.month : null;
      const clicks = Number(s.clicks);
      if (!name || !slug || !month || !Number.isInteger(clicks) || clicks < 0) return null;
      const label = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
      return {
        subject: `${name} in De Webshopgids: ${label}`,
        text: [
          "Hoi,",
          "",
          `In ${label} klikten lezers van De Webshopgids ${clicks} keer door naar ${name}.`,
          `Je pagina: ${SITE.url}/webshop/${slug}`,
          "",
          "Wil je de badge Geverifieerd op je eigen site laten zien? Plak deze code waar je hem wilt hebben:",
          badgeEmbed(slug),
          "",
          "De badge verandert niets aan je score of je plek in een lijst. Opzeggen kan elke maand via de link in je Stripe-bon.",
          "",
          "Groet, De Webshopgids",
        ].join("\n"),
      };
    },
  },
  // Consumed by scripts/ops/digest.ts, never sent on its own.
  digest_summary: { recipient: "internal" },
  // Pre-notice to the shop: `to` is the `prenotice` disputes row, whose email is the shop's contact_email.
  prenotice: { recipient: "dispute", render: renderPrenotice },
  // Dispute replies: slots are { reply: <agent slots>, shop_name, shop_slug }, the last two filled by code.
  ...Object.fromEntries(
    REPLY_TEMPLATE_IDS.map((id): [string, Template] => [
      id,
      {
        recipient: "dispute",
        render: (s) => {
          const v = validateReplySlots(id, s.reply);
          const name = str(s.shop_name, 200);
          const slug = typeof s.shop_slug === "string" && /^[a-z0-9-]{1,100}$/.test(s.shop_slug) ? s.shop_slug : null;
          return v.ok && name && slug ? renderReply(v.slots, { name, slug }) : null;
        },
      },
    ]),
  ),
};

// email_queue templates (plan v3 section 7). Plain-text Dutch emails built from typed slots.
// The sender sends only templates listed here; agents can queue rows but never choose the text.
import { REPLY_TEMPLATE_IDS, renderReply, validateReplySlots } from "../disputes/replies";

export type Rendered = { subject: string; text: string };
type Slots = Record<string, unknown>;
// "dispute": `to` is `dispute:<id>` and the sender resolves the address from that disputes row.
type Template = { recipient: "owner" | "shop" | "dispute"; render: (slots: Slots) => Rendered | null } | { recipient: "internal" };

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
  // Consumed by scripts/ops/digest.ts, never sent on its own.
  digest_summary: { recipient: "internal" },
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

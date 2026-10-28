"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import {
  ANSWER_DAYS,
  CONFIRM_VALID_DAYS,
  MAX_MESSAGE,
  MemoryLimiter,
  PER_SENDER_PER_HOUR,
  PER_SHOP_PER_DAY,
  REMOVAL_DEADLINE_HOURS,
  SITE_WIDE_PER_HOUR,
  addHours,
  confirmRemovalEmail,
  confirmationRecipient,
  disputableStatus,
  needsConfirmation,
  parseDisputeType,
  removedEmail,
} from "@/lib/disputes/core";
import { hashToken, isTokenShape, newToken, normaliseEmail, olderThan } from "@/lib/newsletter/core";
import { sendEmail } from "@/lib/newsletter/resend";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message: string } | null;

type Shop = { id: string; slug: string; name: string; domain: string; status: string; contact_email: string | null };

// Keyed by the sender's address for one hour, in this server instance's memory only.
const perSender = new MemoryLimiter(PER_SENDER_PER_HOUR, 3_600_000);

const RECEIVED = "Bedankt. We hebben je verzoek ontvangen. De score staat nu op “In beoordeling”.";

export async function submitDispute(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: RECEIVED }; // honeypot
  const type = parseDisputeType(formData.get("type"));
  const email = normaliseEmail(formData.get("email"));
  const message = String(formData.get("message") ?? "").trim();
  const slug = String(formData.get("shop") ?? "");
  if (!type) return { ok: false, message: "Kies wat je wilt vragen." };
  if (!email) return { ok: false, message: "Dit e-mailadres klopt niet. Probeer het nog eens." };
  if (message.length > MAX_MESSAGE) return { ok: false, message: `Je bericht is te lang (maximaal ${MAX_MESSAGE} tekens).` };
  if (type === "correction" && message.length < 10) return { ok: false, message: "Schrijf kort wat er niet klopt." };
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return { ok: false, message: "We vinden deze webshop niet." };

  const sender = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!perSender.allow(sender)) return { ok: false, message: "Je hebt al een paar verzoeken gestuurd. Probeer het over een uur nog eens." };

  try {
    const db = createServiceClient();
    const { data: shop } = await db.from("shops").select("id, slug, name, domain, status, contact_email").eq("slug", slug).maybeSingle<Shop>();
    if (!shop || !disputableStatus(shop.status)) return { ok: false, message: "We vinden deze webshop niet." };

    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: siteWide }, { count: forShop }] = await Promise.all([
      db.from("disputes").select("id", { count: "exact", head: true }).neq("type", "prenotice").gte("created_at", hourAgo),
      db.from("disputes").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).neq("type", "prenotice").gte("created_at", dayAgo),
    ]);
    if ((siteWide ?? 0) >= SITE_WIDE_PER_HOUR) return { ok: false, message: "Het formulier is even druk. Probeer het over een uur nog eens." };
    if ((forShop ?? 0) >= PER_SHOP_PER_DAY) return { ok: false, message: "Voor deze webshop zijn vandaag al meerdere verzoeken binnen. We behandelen ze allemaal; je hoeft niets opnieuw te sturen." };

    // The safe direction first, without proof: the score reads "In beoordeling".
    if (shop.status !== "disputed") {
      // Remember the old status, so code restores exactly that once every dispute is answered.
      const { error } = await db.from("shops").update({ status: "disputed", status_before_dispute: shop.status }).eq("id", shop.id).eq("status", shop.status);
      if (error) throw new Error(error.message);
      updateTag("shops");
    }

    const now = new Date();
    if (!needsConfirmation(type)) {
      const { error } = await db.from("disputes").insert({ shop_id: shop.id, email, message: message || null, type, status: "open", deadline_at: addHours(now, ANSWER_DAYS * 24).toISOString() });
      if (error) throw new Error(error.message);
      return { ok: true, message: `${RECEIVED} Je krijgt binnen ${ANSWER_DAYS} dagen antwoord.` };
    }

    const to = confirmationRecipient(shop.contact_email, email, shop.domain);
    const token = to ? newToken() : null;
    const { data: row, error } = await db
      .from("disputes")
      .insert({
        shop_id: shop.id,
        email,
        message: message || null,
        type,
        status: to ? "awaiting_confirmation" : "awaiting_human",
        confirm_token_hash: token ? hashToken(token) : null,
        deadline_at: addHours(now, CONFIRM_VALID_DAYS * 24).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (!to || !token) {
      // No address on the shop's own domain: a person checks who sent this. The message stays in the
      // disputes row (untrusted data); the escalation carries ids only.
      await db.from("agent_escalations").insert({
        agent: "dispute-form",
        kind: "dispute_unverified_sender",
        title: `Verzoek (${type}) voor ${shop.slug} zonder adres op het eigen domein`,
        body_md: `Dispute \`${row.id}\` for shop \`${shop.slug}\`. No role address on ${shop.domain} is known and the sender used another domain. Check the sender before removing anything; the shop already shows "In beoordeling".`,
        label: "needs-human",
      });
      return { ok: true, message: `${RECEIVED} We kunnen niet automatisch controleren of je bij ${shop.name} hoort, dus een medewerker neemt binnen 2 werkdagen contact op. Sneller: stuur het verzoek opnieuw vanaf een e-mailadres op ${shop.domain}.` };
    }

    await sendEmail(to, confirmRemovalEmail(shop.name, type, token), `dispute/${row.id}/confirm`);
    return { ok: true, message: `${RECEIVED} We hebben een bevestigingslink gestuurd naar een adres op ${shop.domain}. Na je klik halen we de pagina direct offline.` };
  } catch (err) {
    console.error("dispute submit failed", err);
    return { ok: false, message: "Er ging iets mis. Probeer het later nog eens of mail ons." };
  }
}

export async function confirmRemoval(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("t");
  if (!isTokenShape(token)) return { ok: false, message: "Deze link klopt niet." };
  const db = createServiceClient();
  const { data: d } = await db
    .from("disputes")
    .select("id, type, confirmed_at, created_at, email, shop_id")
    .eq("confirm_token_hash", hashToken(token))
    .in("type", ["removal", "objection"])
    .maybeSingle();
  if (!d) return { ok: false, message: "Deze link is niet (meer) geldig." };
  if (d.confirmed_at) return { ok: true, message: "Je verzoek was al bevestigd. De pagina is offline." };
  if (olderThan(d.created_at, CONFIRM_VALID_DAYS * 24)) return { ok: false, message: "Deze link is verlopen. Stuur het formulier opnieuw." };

  const now = new Date();
  try {
    // confirmed_at first: if anything below fails, the hourly job still removes the shop.
    const { error: e1 } = await db
      .from("disputes")
      .update({ confirmed_at: now.toISOString(), deadline_at: addHours(now, REMOVAL_DEADLINE_HOURS).toISOString() })
      .eq("id", d.id);
    if (e1) {
      console.error("dispute confirm failed", e1);
      return { ok: false, message: "Er ging iets mis. Probeer de link later nog eens." };
    }
    const { data: shop, error: e2 } = await db.from("shops").update({ status: "removed" }).eq("id", d.shop_id).select("name, domain, contact_email").single();
    if (e2) throw new Error(e2.message);
    updateTag("shops");
    await db.from("disputes").update({ status: "resolved", resolved_at: now.toISOString(), resolved_note: "Removed by code after the signed link was clicked." }).eq("id", d.id);
    const to = confirmationRecipient(shop.contact_email, d.email, shop.domain);
    if (to) await sendEmail(to, removedEmail(shop.name), `dispute/${d.id}/removed`).catch((err) => console.error("removed email failed", err));
    return { ok: true, message: `Bevestigd. De pagina van ${shop.name} is offline. Je krijgt een bevestiging per mail.` };
  } catch (err) {
    console.error("dispute confirm failed", err);
    return { ok: false, message: "Er ging iets mis. We halen de pagina binnen 48 uur alsnog offline." };
  }
}

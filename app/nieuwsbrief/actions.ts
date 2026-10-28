"use server";

import { headers } from "next/headers";
import {
  CONFIRM_VALID_DAYS,
  RESEND_CONFIRM_AFTER_HOURS,
  SUBSCRIBE_PER_SENDER_PER_HOUR,
  SUBSCRIBE_SITE_WIDE_PER_HOUR,
  confirmEmail,
  hashToken,
  isTokenShape,
  newToken,
  normaliseEmail,
  olderThan,
  leadMagnetShops,
  welcomeEmail,
  welcomeShops,
} from "@/lib/newsletter/core";
import { addToGuideSegment, ensureContact, sendToContact, setUnsubscribed } from "@/lib/newsletter/resend";
import { parseUtm, sourceWithUtm } from "@/lib/newsletter/utm";
import { MemoryLimiter, senderKey } from "@/lib/rate-limit";
import { getPublishedShops } from "@/lib/shops/data";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message: string } | null;

const SAME_ANSWER = "Bijna klaar: check je inbox en bevestig je inschrijving.";
const BUSY = "Er komen nu veel aanmeldingen binnen. Probeer het over een uur nog eens.";

const perSender = new MemoryLimiter(SUBSCRIBE_PER_SENDER_PER_HOUR, 3_600_000);

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: SAME_ANSWER }; // honeypot: bots fill every field
  const email = normaliseEmail(formData.get("email"));
  if (!email) return { ok: false, message: "Dit e-mailadres klopt niet. Probeer het nog eens." };
  const sourcePath = String(formData.get("source") ?? "").slice(0, 120);
  const utm = parseUtm(safeJson(formData.get("utm")));
  if (!perSender.allow(senderKey(await headers()))) return { ok: false, message: "Je hebt het formulier al een paar keer verstuurd. Probeer het over een uur nog eens." };

  try {
    const db = createServiceClient();
    // Before any call to Resend: the database count holds across server instances.
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count, error: countError } = await db.from("subscribers").select("id", { count: "exact", head: true }).is("confirmed_at", null).gte("created_at", hourAgo);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= SUBSCRIBE_SITE_WIDE_PER_HOUR) return { ok: false, message: BUSY };
    const contactId = await ensureContact(email);
    const { data: existing } = await db.from("subscribers").select("id, confirmed_at, created_at").eq("resend_contact_id", contactId).maybeSingle();
    // Same answer in every case, so the form does not reveal who is subscribed.
    if (existing?.confirmed_at) return { ok: true, message: SAME_ANSWER };
    if (existing && !olderThan(existing.created_at, RESEND_CONFIRM_AFTER_HOURS)) return { ok: true, message: SAME_ANSWER };
    if (existing) await db.from("subscribers").delete().eq("id", existing.id);

    const token = newToken();
    const { data: row, error } = await db
      .from("subscribers")
      .insert({ token_hash: hashToken(token), resend_contact_id: contactId, source_path: sourcePath.startsWith("/") ? sourceWithUtm(sourcePath, utm) : null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await sendToContact(contactId, confirmEmail(token), `confirm/${row.id}`);
    return { ok: true, message: SAME_ANSWER };
  } catch (err) {
    console.error("newsletter subscribe failed", err);
    return { ok: false, message: "Er ging iets mis. Probeer het later nog eens." };
  }
}

export async function confirm(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("t");
  if (!isTokenShape(token)) return { ok: false, message: "Deze link klopt niet." };
  const db = createServiceClient();
  const { data: sub } = await db.from("subscribers").select("id, confirmed_at, created_at, resend_contact_id").eq("token_hash", hashToken(token)).maybeSingle();
  if (!sub) return { ok: false, message: "Deze link is niet (meer) geldig. Meld je opnieuw aan." };
  if (sub.confirmed_at) return { ok: true, message: "Je inschrijving was al bevestigd." };
  if (olderThan(sub.created_at, CONFIRM_VALID_DAYS * 24)) return { ok: false, message: "Deze link is verlopen. Meld je opnieuw aan." };

  try {
    await setUnsubscribed(sub.resend_contact_id, false);
    await addToGuideSegment(sub.resend_contact_id);
    await db.from("subscribers").update({ confirmed_at: new Date().toISOString() }).eq("id", sub.id);
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [{ data: clicks }, shops] = await Promise.all([
      db.from("clicks").select("shop_id").gte("occurred_at", since).neq("device", "bot").limit(10_000),
      getPublishedShops(),
    ]);
    const top = welcomeShops(shops, (clicks ?? []).map((c) => c.shop_id as string));
    if (top.length > 0) await sendToContact(sub.resend_contact_id, welcomeEmail(top, token, leadMagnetShops(shops)), `welcome/${sub.id}`);
    return { ok: true, message: "Gelukt! Je bent ingeschreven. Je welkomstmail is onderweg." };
  } catch (err) {
    console.error("newsletter confirm failed", err);
    return { ok: false, message: "Er ging iets mis. Probeer de link later nog eens." };
  }
}

/** Unsubscribing removes our row: we keep nothing about former subscribers. */
export async function unsubscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("t");
  if (!isTokenShape(token)) return { ok: false, message: "Deze link klopt niet." };
  const db = createServiceClient();
  const { data: sub } = await db.from("subscribers").select("id, resend_contact_id").eq("token_hash", hashToken(token)).maybeSingle();
  if (!sub) return { ok: true, message: "Je bent afgemeld." };
  try {
    await setUnsubscribed(sub.resend_contact_id, true);
    await db.from("subscribers").delete().eq("id", sub.id);
    return { ok: true, message: "Je bent afgemeld. Je krijgt geen nieuwsbrief meer van ons." };
  } catch (err) {
    console.error("newsletter unsubscribe failed", err);
    return { ok: false, message: "Er ging iets mis. Probeer het later nog eens of mail ons." };
  }
}

function safeJson(v: FormDataEntryValue | null): Record<string, unknown> | null {
  if (typeof v !== "string" || !v || v.length > 500) return null;
  try {
    const parsed: unknown = JSON.parse(v);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

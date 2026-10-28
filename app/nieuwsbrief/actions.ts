"use server";

import {
  CONFIRM_VALID_DAYS,
  RESEND_CONFIRM_AFTER_HOURS,
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
import { getPublishedShops } from "@/lib/shops/data";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message: string } | null;

const SAME_ANSWER = "Bijna klaar: check je inbox en bevestig je inschrijving.";

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: SAME_ANSWER }; // honeypot: bots fill every field
  const email = normaliseEmail(formData.get("email"));
  if (!email) return { ok: false, message: "Dit e-mailadres klopt niet. Probeer het nog eens." };
  const sourcePath = String(formData.get("source") ?? "").slice(0, 200);

  try {
    const db = createServiceClient();
    const contactId = await ensureContact(email);
    const { data: existing } = await db.from("subscribers").select("id, confirmed_at, created_at").eq("resend_contact_id", contactId).maybeSingle();
    // Same answer in every case, so the form does not reveal who is subscribed.
    if (existing?.confirmed_at) return { ok: true, message: SAME_ANSWER };
    if (existing && !olderThan(existing.created_at, RESEND_CONFIRM_AFTER_HOURS)) return { ok: true, message: SAME_ANSWER };
    if (existing) await db.from("subscribers").delete().eq("id", existing.id);

    const token = newToken();
    const { data: row, error } = await db
      .from("subscribers")
      .insert({ token_hash: hashToken(token), resend_contact_id: contactId, source_path: sourcePath.startsWith("/") ? sourcePath : null })
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

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { badgeEligibility } from "@/lib/badge/eligibility";
import { checkoutConfig } from "@/lib/badge/pricing";
import { confirmationRecipient } from "@/lib/disputes/core";
import {
  CLAIMABLE_STATUSES,
  CLAIM_PER_SENDER_PER_HOUR,
  CLAIM_PER_SHOP_PER_DAY,
  CLAIM_SITE_WIDE_PER_HOUR,
  CLAIM_VALID_DAYS,
  claimEmail,
  descriptionProblem,
  normaliseDescription,
} from "@/lib/claims/core";
import { hashToken, isTokenShape, newToken, normaliseEmail } from "@/lib/newsletter/core";
import { sendEmail } from "@/lib/newsletter/resend";
import { MemoryLimiter, senderKey } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";
import { createBadgeCheckout } from "@/lib/stripe/checkout";
import { createPortalSession } from "@/lib/stripe/portal";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message: string } | null;

const perSender = new MemoryLimiter(CLAIM_PER_SENDER_PER_HOUR, 3_600_000);

/** Step 1: send an edit link to an address on the shop's own domain. The address is not stored. */
export async function requestClaim(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: "Bedankt. Kijk in je inbox." }; // honeypot
  const email = normaliseEmail(formData.get("email"));
  const slug = String(formData.get("shop") ?? "");
  if (!email) return { ok: false, message: "Dit e-mailadres klopt niet. Probeer het nog eens." };
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return { ok: false, message: "We vinden deze webshop niet." };
  if (!perSender.allow(senderKey(await headers()))) return { ok: false, message: "Je hebt al een paar links aangevraagd. Probeer het over een uur nog eens." };

  try {
    const db = createServiceClient();
    const { data: shop } = await db.from("shops").select("id, name, domain, status, contact_email").eq("slug", slug).maybeSingle();
    if (!shop || !CLAIMABLE_STATUSES.includes(shop.status)) return { ok: false, message: "We vinden deze webshop niet." };
    const to = confirmationRecipient(shop.contact_email, email, shop.domain);
    if (!to) return { ok: false, message: `Gebruik een e-mailadres op ${shop.domain}. Zo weten we dat je bij de webshop hoort.` };

    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: siteWide }, { count: forShop }] = await Promise.all([
      db.from("shop_claims").select("id", { count: "exact", head: true }).gte("created_at", hourAgo),
      db.from("shop_claims").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).gte("created_at", dayAgo),
    ]);
    if ((siteWide ?? 0) >= CLAIM_SITE_WIDE_PER_HOUR) return { ok: false, message: "Het formulier is even druk. Probeer het over een uur nog eens." };
    if ((forShop ?? 0) >= CLAIM_PER_SHOP_PER_DAY) return { ok: false, message: "Voor deze webshop zijn vandaag al links verstuurd. Kijk in de inbox van het adres op je domein." };

    const token = newToken();
    const { data: claim, error } = await db
      .from("shop_claims")
      .insert({ shop_id: shop.id, token_hash: hashToken(token), expires_at: new Date(Date.now() + CLAIM_VALID_DAYS * 86_400_000).toISOString() })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await sendEmail(to, claimEmail(shop.name, token), `claim/${claim.id}`);
    const where = to === email ? to : `het adres dat op ${shop.domain} staat`;
    return { ok: true, message: `We hebben een link gestuurd naar ${where}. Daarmee kun je ${CLAIM_VALID_DAYS} dagen je beschrijving aanpassen.` };
  } catch (err) {
    console.error("claim request failed", err);
    return { ok: false, message: "Er ging iets mis. Probeer het later nog eens of mail ons." };
  }
}

/** Step 2: with a valid link, propose a description. It waits for review; one open proposal per shop. */
export async function submitDescription(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = formData.get("t");
  if (!isTokenShape(token)) return { ok: false, message: "Deze link klopt niet." };
  const text = normaliseDescription(formData.get("description"));
  const problem = descriptionProblem(text);
  if (problem) return { ok: false, message: problem };

  try {
    const db = createServiceClient();
    const { data: claim } = await db.from("shop_claims").select("id, shop_id, expires_at, verified_at").eq("token_hash", hashToken(token)).maybeSingle();
    if (!claim || new Date(claim.expires_at) < new Date()) return { ok: false, message: "Deze link is verlopen. Vraag een nieuwe aan via de pagina van je webshop." };
    if (!claim.verified_at) await db.from("shop_claims").update({ verified_at: new Date().toISOString() }).eq("id", claim.id);

    const { data: open } = await db.from("shop_edits").select("id").eq("shop_id", claim.shop_id).eq("status", "pending").maybeSingle();
    const { error } = open
      ? await db.from("shop_edits").update({ description_nl: text, claim_id: claim.id, created_at: new Date().toISOString() }).eq("id", open.id)
      : await db.from("shop_edits").insert({ shop_id: claim.shop_id, claim_id: claim.id, description_nl: text });
    if (error) throw new Error(error.message);
    return { ok: true, message: "Bedankt. We bekijken je tekst binnen 2 werkdagen; daarna staat hij op de pagina van je webshop." };
  } catch (err) {
    console.error("claim edit failed", err);
    return { ok: false, message: "Er ging iets mis. Probeer het later nog eens." };
  }
}

/** Badge checkout from the claim link: the token proves the buyer reads mail on the shop's domain. */
export async function startBadgeCheckout(formData: FormData) {
  const token = formData.get("t");
  const plan = formData.get("plan");
  const config = checkoutConfig();
  if (!isTokenShape(token) || (plan !== "month" && plan !== "year") || !config) redirect("/geverifieerd?fout=1");
  let url: string | null = null;
  try {
    const db = createServiceClient();
    const { data: claim } = await db.from("shop_claims").select("shop_id, expires_at").eq("token_hash", hashToken(token)).maybeSingle();
    if (claim && new Date(claim.expires_at) >= new Date()) {
      const { data: shop } = await db.from("shops").select("id, status, score, verified_badge_until").eq("id", claim.shop_id).single();
      if (shop && badgeEligibility(shop).kind === "can_buy") url = await createBadgeCheckout(shop.id, plan, config, SITE.url);
    }
  } catch (err) {
    console.error("badge checkout failed", err);
  }
  redirect(url ?? "/geverifieerd?fout=1");
}

/** Stripe customer portal from the claim link: cancel, change card, invoices. Same token check as buying. */
export async function openBadgePortal(formData: FormData) {
  const token = formData.get("t");
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!isTokenShape(token) || !/^(sk|rk)_(live|test)_/.test(secretKey)) redirect("/geverifieerd?portaal=fout");
  let url: string | null = null;
  try {
    const db = createServiceClient();
    const { data: claim } = await db.from("shop_claims").select("shop_id, expires_at").eq("token_hash", hashToken(token)).maybeSingle();
    if (claim && new Date(claim.expires_at) >= new Date()) {
      const { data: shop } = await db.from("shops").select("stripe_subscription_id").eq("id", claim.shop_id).single();
      // The return URL carries no claim token: Stripe stores it.
      if (shop?.stripe_subscription_id) url = await createPortalSession(shop.stripe_subscription_id, secretKey, `${SITE.url}/geverifieerd`);
    }
  } catch (err) {
    console.error("badge portal failed", err);
  }
  redirect(url ?? "/geverifieerd?portaal=fout");
}

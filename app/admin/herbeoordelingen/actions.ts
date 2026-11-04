"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validateReplySlots } from "@/lib/disputes/replies";
import { CORRECTION_ROWS, factColumns, isOverrideFact, parseFactInput, type OverrideFact } from "@/lib/overrides/facts";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A form mistake goes back to the page with a short code the page explains, instead of the error page. */
function backWith(code: "feiten" | "dubbel" | "waarde" | "score" | "leeg" | "reden"): never {
  redirect(`/admin/herbeoordelingen?fout=${code}`);
}

// G4 (plan v3 section 4): Stefan decides disputes the Dispute Handler handed over.
// "No change" queues the dispute_no_change template; the hourly restore job then gives the
// shop its old status back. "Hide" takes the shop offline (safe direction), tells the sender
// with the dispute_hidden template and closes the dispute.
export async function decideDispute(formData: FormData) {
  const email = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision");
  if (!UUID.test(id)) throw new Error("invalid dispute");
  const db = createServiceClient();
  const { data: d, error } = await db
    .from("disputes")
    .select("id, shop_id, status, shops:shop_id (name, slug)")
    .eq("id", id)
    .single<{ id: string; shop_id: string; status: string; shops: { name: string; slug: string } | null }>();
  if (error) throw new Error(error.message);
  if (d.status !== "awaiting_human") throw new Error("dispute is not waiting for a decision");

  if (decision === "no_change") {
    const v = validateReplySlots("dispute_no_change", { checked_facts: formData.getAll("fact").map(String) });
    if (!v.ok) backWith("feiten");
    const { template, ...slots } = v.slots;
    const { error: e } = await db.from("disputes")
      .update({ status: "agent_replied", reply_template_id: template, reply_slots: slots, resolved_note: `No change, decided by ${email}.` })
      .eq("id", id).eq("status", "awaiting_human");
    if (e) throw new Error(e.message);
  } else if (decision === "hide") {
    const { error: e1 } = await db.from("shops").update({ status: "hidden" }).eq("id", d.shop_id).eq("status", "disputed");
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await db.from("disputes")
      .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_note: `Shop hidden, decided by ${email}.` })
      .eq("id", id).eq("status", "awaiting_human");
    if (e2) throw new Error(e2.message);
    // Same shape as scripts/disputes/queue-replies.ts, so the sender resolves the address from the dispute.
    const { error: e3 } = await db.from("email_queue").insert({
      to: `dispute:${id}`, template: "dispute_hidden", priority: 2,
      slots: { reply: {}, shop_name: d.shops?.name, shop_slug: d.shops?.slug },
    });
    if (e3) throw new Error(e3.message);
    updateTag("shops");
  } else {
    throw new Error("invalid decision");
  }
  // A decided dispute retires the agent's draft score corrections for that shop.
  await db.from("score_overrides").update({ status: "rejected", approved_by: email }).eq("shop_id", d.shop_id).eq("status", "draft");
  revalidatePath("/admin/herbeoordelingen");
  redirect("/admin/herbeoordelingen"); // drops an old ?fout= notice after a decision that worked
}

// G4 "correction": Stefan agrees the sender is right. Fact corrections go in fact_overrides and
// are written to the shop at once; the nightly apply-overrides step keeps them in place. A new
// score goes in score_overrides and is applied by that step (only the pipeline writes scores).
// The sender gets dispute_corrected with exactly what changed; the restore job then gives the
// shop its old status back.
export async function correctDispute(formData: FormData) {
  const email = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("invalid dispute");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 2000);
  if (!reason) backWith("reden");

  const facts: { fact: OverrideFact; value: Record<string, unknown>; publicValue: string }[] = [];
  for (let i = 1; i <= CORRECTION_ROWS; i++) {
    const fact = String(formData.get(`fact_${i}`) ?? "");
    const raw = String(formData.get(`value_${i}`) ?? "");
    if (!fact || !raw.trim()) continue;
    if (!isOverrideFact(fact)) throw new Error(`unknown fact ${fact}`);
    if (facts.some((f) => f.fact === fact)) backWith("dubbel");
    const p = parseFactInput(fact, raw);
    if (!p.ok) backWith("waarde");
    facts.push({ fact, value: p.value, publicValue: p.publicValue });
  }
  const scoreRaw = String(formData.get("score") ?? "").trim();
  const newScore = scoreRaw ? Number(scoreRaw) : null;
  if (newScore !== null && !(Number.isInteger(newScore) && newScore >= 1 && newScore <= 100)) backWith("score");
  if (!facts.length && newScore === null) backWith("leeg");

  const corrected = [
    ...facts.map((f) => ({ fact: f.fact, value: f.publicValue })),
    ...(newScore !== null ? [{ fact: "score", value: `${newScore} van 100` }] : []),
  ];
  const v = validateReplySlots("dispute_corrected", { corrected_facts: corrected });
  if (!v.ok) throw new Error(v.errors.join("; "));

  const db = createServiceClient();
  const { data: d, error } = await db
    .from("disputes")
    .select("id, shop_id, status, shops:shop_id (name, slug, score)")
    .eq("id", id)
    .single<{ id: string; shop_id: string; status: string; shops: { name: string; slug: string; score: number | null } | null }>();
  if (error) throw new Error(error.message);
  if (d.status !== "awaiting_human") throw new Error("dispute is not waiting for a decision");

  const now = new Date().toISOString();
  for (const f of facts) {
    const { error: e1 } = await db.from("fact_overrides").update({ status: "revoked" })
      .eq("shop_id", d.shop_id).eq("fact", f.fact).in("status", ["approved", "applied"]);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await db.from("fact_overrides").insert({
      shop_id: d.shop_id, fact: f.fact, value: f.value, reason, dispute_id: id, status: "applied", approved_by: email, applied_at: now,
    });
    if (e2) throw new Error(e2.message);
    const { error: e3 } = await db.from("shops").update(factColumns(f.fact, f.value)).eq("id", d.shop_id);
    if (e3) throw new Error(e3.message);
  }
  if (newScore !== null) {
    const { error: e4 } = await db.from("score_overrides").update({ status: "revoked" })
      .eq("shop_id", d.shop_id).in("status", ["approved", "applied"]);
    if (e4) throw new Error(e4.message);
    const { error: e5 } = await db.from("score_overrides").insert({
      shop_id: d.shop_id, proposed_by: "human", old_total: d.shops?.score ?? null, new_total: newScore,
      reason: `dispute ${id}: ${reason}`, status: "approved", approved_by: email,
    });
    if (e5) throw new Error(e5.message);
  }

  const { template, ...reply } = v.slots;
  // Queue first: the hourly queue-replies job skips a dispute whose reply is already queued.
  const { error: e6 } = await db.from("email_queue").insert({
    to: `dispute:${id}`, template, priority: 2, slots: { reply, shop_name: d.shops?.name, shop_slug: d.shops?.slug },
  });
  if (e6) throw new Error(e6.message);
  const { error: e7 } = await db.from("disputes")
    .update({ status: "agent_replied", reply_template_id: template, reply_slots: reply, resolved_note: `Corrected by ${email}: ${reason}` })
    .eq("id", id).eq("status", "awaiting_human");
  if (e7) throw new Error(e7.message);
  await db.from("score_overrides").update({ status: "rejected", approved_by: email }).eq("shop_id", d.shop_id).eq("status", "draft");
  updateTag("shops");
  revalidatePath("/admin/herbeoordelingen");
  redirect("/admin/herbeoordelingen"); // drops an old ?fout= notice after a decision that worked
}

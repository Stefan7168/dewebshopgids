"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { descriptionProblem } from "@/lib/claims/core";
import { factColumns, parseFactInput } from "@/lib/overrides/facts";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Claim moderation: a person decides on every owner description. Approval writes a
// 'beschrijving' fact override, so the nightly pipeline keeps the owner's text after rescoring.
export async function decideDescription(formData: FormData) {
  const email = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!UUID.test(id)) throw new Error("invalid proposal");
  if (decision !== "approved" && decision !== "rejected") throw new Error("invalid decision");

  const db = createServiceClient();
  const { data: e, error } = await db.from("shop_edits").select("id, shop_id, description_nl, status").eq("id", id).single();
  if (error) throw new Error(error.message);
  if (e.status !== "pending") throw new Error("proposal is already decided");
  const now = new Date().toISOString();

  if (decision === "approved") {
    // Same rules as the form, checked again: the text may have been stored by an older version.
    const problem = descriptionProblem(e.description_nl);
    if (problem) throw new Error(`cannot approve: ${problem}`);
    const p = parseFactInput("beschrijving", e.description_nl);
    if (!p.ok) throw new Error(p.error);
    const { error: e1 } = await db.from("fact_overrides").update({ status: "revoked" })
      .eq("shop_id", e.shop_id).eq("fact", "beschrijving").in("status", ["approved", "applied"]);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await db.from("fact_overrides").insert({
      shop_id: e.shop_id, fact: "beschrijving", value: p.value, reason: `Tekst van de webshop zelf (voorstel ${id})`,
      status: "applied", approved_by: email, applied_at: now,
    });
    if (e2) throw new Error(e2.message);
    const { error: e3 } = await db.from("shops").update(factColumns("beschrijving", p.value)).eq("id", e.shop_id);
    if (e3) throw new Error(e3.message);
  }

  const { error: e4 } = await db.from("shop_edits")
    .update({ status: decision, review_note: note, reviewed_by: email, reviewed_at: now })
    .eq("id", id).eq("status", "pending");
  if (e4) throw new Error(e4.message);
  if (decision === "approved") updateTag("shops");
  revalidatePath("/admin/beschrijvingen");
}

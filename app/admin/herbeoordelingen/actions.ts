"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validateReplySlots } from "@/lib/disputes/replies";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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
    if (!v.ok) throw new Error(v.errors.join("; "));
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
}

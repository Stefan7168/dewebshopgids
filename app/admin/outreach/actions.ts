"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function ids(formData: FormData): string[] {
  const list = formData.getAll("id").map(String);
  if (!list.length || list.length > 50 || !list.every((id) => UUID.test(id))) throw new Error("invalid drafts");
  return list;
}

// G3 (plan v3 section 4): Stefan approves badge offers. Approved drafts become email_queue rows;
// the sender adds the payment link and opt-out and sends to the shop's role address.
export async function approveDrafts(formData: FormData) {
  const email = await requireAdmin();
  const db = createServiceClient();
  const { data: drafts, error } = await db
    .from("outreach_drafts")
    .update({ status: "queued", approved_by: email })
    .in("id", ids(formData))
    .eq("status", "draft")
    .select("id, shop_id, subject, body_md, shops!inner(slug, outreach_opt_out_at)")
    .returns<{ id: string; shop_id: string; subject: string; body_md: string; shops: { slug: string; outreach_opt_out_at: string | null } }[]>();
  if (error) throw new Error(error.message);
  const rows = (drafts ?? [])
    .filter((d) => !d.shops.outreach_opt_out_at)
    .map((d) => ({
      shop_id: d.shop_id,
      template: "outreach_badge",
      priority: 7,
      slots: { subject: d.subject, body: d.body_md, shop_id: d.shop_id, shop_slug: d.shops.slug },
    }));
  if (rows.length) {
    const { error: qErr } = await db.from("email_queue").insert(rows);
    if (qErr) {
      await db.from("outreach_drafts").update({ status: "draft", approved_by: null }).in("id", (drafts ?? []).map((d) => d.id));
      throw new Error(qErr.message);
    }
  }
  revalidatePath("/admin/outreach");
}

export async function rejectDraft(formData: FormData) {
  await requireAdmin();
  const { error } = await createServiceClient().from("outreach_drafts").update({ status: "expired" }).in("id", ids(formData)).eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/outreach");
}

// A shop that answered "stop": never draft or mail it again, and drop what is waiting.
export async function optOutShop(formData: FormData) {
  await requireAdmin();
  const domain = String(formData.get("domain") ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("invalid domain");
  const db = createServiceClient();
  const { data, error } = await db.from("shops").update({ outreach_opt_out_at: new Date().toISOString() }).eq("domain", domain).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(`no shop with domain ${domain}`);
  const shopIds = data.map((s) => s.id);
  await db.from("outreach_drafts").update({ status: "expired" }).in("shop_id", shopIds).in("status", ["draft", "approved"]);
  await db.from("email_queue").delete().in("shop_id", shopIds).eq("template", "outreach_badge").is("sent_at", null);
  revalidatePath("/admin/outreach");
}

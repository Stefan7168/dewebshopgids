"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// G2 (plan v3 section 4): Stefan approves the email for a fact-checked guide. The Thursday
// publisher then sends it; without this tap the page publishes and the email is skipped.
export async function approveGuide(formData: FormData) {
  const email = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("invalid guide");
  const { data, error } = await createServiceClient()
    .from("guide_issues")
    .update({ status: "approved", approved_by: email })
    .eq("id", id)
    .eq("status", "fact_checked")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("guide is not fact-checked (or already approved)");
  revalidatePath("/admin/gids");
}

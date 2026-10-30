"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// G6: only Stefan decides which candidate domains enter the pipeline.
export async function decideCandidates(formData: FormData) {
  const email = await requireAdmin();
  const decision = formData.get("decision");
  if (decision !== "accepted" && decision !== "rejected") throw new Error("invalid decision");
  const ids = formData.getAll("id").map(String).filter((id) => UUID.test(id));
  if (ids.length === 0) return;

  const { error } = await createServiceClient()
    .from("shop_candidates")
    .update({ status: decision, decided_by: email })
    .in("id", ids)
    .eq("status", "new");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/kandidaten");
}

// One row from the same form: rejects only the domain on that row, whatever else is ticked.
export async function rejectCandidate(formData: FormData) {
  const email = await requireAdmin();
  const id = String(formData.get("one") ?? "");
  if (!UUID.test(id)) throw new Error("invalid candidate");
  const { error } = await createServiceClient()
    .from("shop_candidates")
    .update({ status: "rejected", decided_by: email })
    .eq("id", id)
    .eq("status", "new");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/kandidaten");
}

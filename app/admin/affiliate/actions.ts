"use server";

import { revalidatePath, updateTag } from "next/cache";
import { parseAffiliateUrl } from "@/lib/affiliate/url";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Sets or clears a shop's affiliate link. /go/[slug] reads it; order and score never do.
export async function setAffiliateUrl(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("invalid shop");
  const p = parseAffiliateUrl(String(formData.get("url") ?? ""));
  if (!p.ok) throw new Error(p.error);
  const { error } = await createServiceClient()
    .from("shops")
    .update({ affiliate_url: p.url, affiliate_available: p.url !== null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("shops");
  revalidatePath("/admin/affiliate");
}

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "./admin";

/** Returns the admin's email, or redirects to the login page. Call in every admin page and action. */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (error || !email || !isAdminEmail(email)) redirect("/auth/login");
  return email;
}

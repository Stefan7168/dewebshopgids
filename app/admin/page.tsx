import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";

async function AdminHome() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !isAdminEmail(data?.claims?.email as string | undefined)) {
    redirect("/auth/login");
  }

  return (
    <p className="text-sm">
      Ingelogd als {String(data?.claims?.email)}. Gates, kill switch en run log
      komen hier (zie plan, sectie 15).
    </p>
  );
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Beheer</h1>
      <Suspense>
        <AdminHome />
      </Suspense>
    </div>
  );
}

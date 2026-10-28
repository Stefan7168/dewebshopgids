import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";

async function AdminHome() {
  const email = await requireAdmin();
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p>Ingelogd als {email}.</p>
      <ul className="list-disc pl-5">
        <li>
          <Link href="/admin/kandidaten" className="underline">
            G6: nieuwe webshops goedkeuren
          </Link>
        </li>
      </ul>
    </div>
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

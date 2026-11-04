"use client";

import Link from "next/link";

// Admin actions throw on a refused or stale write (for example a second click on an item that is already decided).
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <h1 className="font-bold text-2xl">Dat lukte niet</h1>
      <p>
        De actie is niet uitgevoerd. Vaak is het item al afgehandeld, bijvoorbeeld na een dubbele klik. Ververs de pagina en kijk of het nog
        open staat. Blijft het misgaan, zoek dan de code hieronder op in de Vercel-logs.
      </p>
      {error.digest && <p className="text-muted-foreground">Code: {error.digest}</p>}
      <div className="flex gap-4">
        <button type="button" onClick={reset} className="underline">
          Opnieuw laden
        </button>
        <Link href="/admin" className="underline">
          Naar het overzicht
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

// Without this, a failed database read shows Next.js's English "Application error" page.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen w-full max-w-3xl mx-auto px-4 py-12 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Er ging iets mis</h1>
      <p>Deze pagina kon even niet laden. Probeer het opnieuw, of ga naar de homepage.</p>
      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center underline">
          Opnieuw proberen
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center underline">
          Naar de homepage
        </Link>
      </div>
    </main>
  );
}

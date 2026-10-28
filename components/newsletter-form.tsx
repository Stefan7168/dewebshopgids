"use client";

import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/nieuwsbrief/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm({ headline, source }: { headline: string; source: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);
  return (
    <section className="rounded-lg border p-4 flex flex-col gap-3" aria-labelledby="nieuwsbrief-kop">
      <h2 id="nieuwsbrief-kop" className="font-semibold">
        {headline}
      </h2>
      {state?.ok ? (
        <p className="text-sm">{state.message}</p>
      ) : (
        <form action={action} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="nieuwsbrief-email" className="sr-only">
            E-mailadres
          </label>
          <Input id="nieuwsbrief-email" name="email" type="email" required autoComplete="email" placeholder="jouw@email.nl" className="h-11" />
          {/* Honeypot: hidden from people, filled by bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <input type="hidden" name="source" value={source} />
          <Button type="submit" disabled={pending} className="h-11">
            Aanmelden
          </Button>
        </form>
      )}
      {state && !state.ok && <p className="text-sm text-red-700">{state.message}</p>}
      <p className="text-xs text-muted-foreground">Je krijgt eerst een mail om te bevestigen. Afmelden kan altijd met één klik.</p>
    </section>
  );
}

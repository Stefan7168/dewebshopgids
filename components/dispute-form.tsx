"use client";

import { useActionState } from "react";
import { submitDispute, type FormState } from "@/app/herbeoordeling/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DISPUTE_TYPES, MAX_MESSAGE } from "@/lib/disputes/core";

export function DisputeForm({ slug, domain, initialType }: { slug: string; domain: string; initialType: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitDispute, null);
  if (state?.ok) return <p role="status">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="shop" value={slug} />
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium mb-1">Wat wil je vragen?</legend>
        {Object.entries(DISPUTE_TYPES).map(([value, label]) => (
          <label key={value} className="flex items-start gap-3 min-h-11 py-2">
            <input type="radio" name="type" value={value} required defaultChecked={value === initialType} className="mt-1 h-4 w-4" />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1">
        <label htmlFor="dispute-email" className="font-medium">
          Je e-mailadres
        </label>
        <Input id="dispute-email" name="email" type="email" required autoComplete="email" className="h-11" />
        <p className="text-xs text-muted-foreground">
          Voor verwijderen of bezwaar sturen we een bevestigingslink naar een adres op {domain}. Zo weten we dat het verzoek van de webshop zelf komt.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="dispute-message" className="font-medium">
          Toelichting
        </label>
        <textarea
          id="dispute-message"
          name="message"
          rows={6}
          maxLength={MAX_MESSAGE}
          className="rounded-md border border-input bg-background px-3 py-2 text-base"
          placeholder="Bijvoorbeeld: wij hebben sinds maart het Thuiswinkel Waarborg-keurmerk."
        />
      </div>
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state && !state.ok && <p className="text-sm text-red-700">{state.message}</p>}
      <Button type="submit" disabled={pending} className="h-11 self-start">
        Verstuur
      </Button>
    </form>
  );
}

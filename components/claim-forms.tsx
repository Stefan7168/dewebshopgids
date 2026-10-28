"use client";

import { useActionState, useState } from "react";
import { requestClaim, submitDescription, type FormState } from "@/app/beheer/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DESCRIPTION_MAX } from "@/lib/claims/core";

export function ClaimRequestForm({ slug, domain }: { slug: string; domain: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestClaim, null);
  if (state?.ok) return <p role="status">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="shop" value={slug} />
      <div className="flex flex-col gap-1">
        <label htmlFor="claim-email" className="font-medium">
          E-mailadres op {domain}
        </label>
        <Input id="claim-email" name="email" type="email" required autoComplete="email" className="h-11" />
        <p className="text-xs text-muted-foreground">We bewaren dit adres niet. Staat er een algemeen adres op je site, dan sturen we de link daarheen.</p>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state && !state.ok && <p className="text-sm text-red-700">{state.message}</p>}
      <Button type="submit" disabled={pending} className="h-11 self-start">
        Stuur mij een link
      </Button>
    </form>
  );
}

export function DescriptionForm({ token, current }: { token: string; current: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitDescription, null);
  const [text, setText] = useState(current);
  if (state?.ok) return <p role="status">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="t" value={token} />
      <div className="flex flex-col gap-1">
        <label htmlFor="claim-description" className="font-medium">
          Beschrijving
        </label>
        <textarea
          id="claim-description"
          name="description"
          rows={6}
          maxLength={DESCRIPTION_MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {text.length} van {DESCRIPTION_MAX} tekens. Beschrijf wat je maakt of verkoopt. Geen namen, telefoonnummers, links of beoordelingen.
        </p>
      </div>
      {state && !state.ok && <p className="text-sm text-red-700">{state.message}</p>}
      <Button type="submit" disabled={pending} className="h-11 self-start">
        Ter controle insturen
      </Button>
    </form>
  );
}

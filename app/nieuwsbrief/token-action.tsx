"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "./actions";

/** A button, not an automatic GET action, so email link scanners cannot confirm or unsubscribe. */
export function TokenAction({ token, label, action }: { token: string; label: string; action: (prev: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, null);
  if (state) return <p className={state.ok ? "" : "text-red-700"}>{state.message}</p>;
  return (
    <form action={run}>
      <input type="hidden" name="t" value={token} />
      <Button type="submit" disabled={pending} className="h-11">
        {label}
      </Button>
    </form>
  );
}

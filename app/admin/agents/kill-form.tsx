"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { killAgents, type KillResult } from "./actions";

export function KillForm() {
  const [state, action, pending] = useActionState<KillResult, FormData>(killAgents, null);
  return (
    <form action={action} className="flex flex-col gap-2 max-w-sm">
      <label htmlFor="confirm" className="text-sm">
        Typ STOP om alle agents direct te stoppen.
      </label>
      <div className="flex gap-2">
        <Input id="confirm" name="confirm" autoComplete="off" />
        <Button type="submit" variant="destructive" disabled={pending}>
          Stop alles
        </Button>
      </div>
      {state && <p className="text-sm">{state.note}</p>}
    </form>
  );
}

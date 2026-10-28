// Pure decision logic for the soft guards. No I/O, so it is unit tested.
// The hard stops are kill-switch.yml, the Anthropic Console spend limit and
// pausing routines in the routines UI (plan section 7 and 9).

export type Settings = Record<string, unknown>;

export type GuardResult = { ok: true } | { ok: false; reason: string };

export function decideKillSwitch(
  settings: Settings,
  agent: string,
  now: Date,
  agentsPausedVar?: string,
): GuardResult {
  if (agentsPausedVar === "true") {
    return { ok: false, reason: "repository variable AGENTS_PAUSED is true" };
  }
  if (settings["agents_enabled"] !== true) {
    return { ok: false, reason: "agent_settings.agents_enabled is not true" };
  }
  if (settings[`enabled.${agent}`] === false) {
    return { ok: false, reason: `agent_settings.enabled.${agent} is false` };
  }
  const until = settings[`paused_until.${agent}`];
  if (typeof until === "string") {
    const t = Date.parse(until);
    if (Number.isNaN(t) || t > now.getTime()) {
      return { ok: false, reason: `agent paused until ${until}` };
    }
  }
  return { ok: true };
}

export function decideBudget(settings: Settings): GuardResult {
  const budget = Number(settings["monthly_budget_usd"]);
  const spent = Number(settings["month_spend_usd"] ?? 0);
  if (!Number.isFinite(budget) || budget <= 0) {
    return { ok: false, reason: "monthly_budget_usd is missing or not positive" };
  }
  if (!Number.isFinite(spent)) {
    return { ok: false, reason: "month_spend_usd is not a number" };
  }
  if (spent >= budget) {
    return { ok: false, reason: `month spend ${spent} USD reached budget ${budget} USD` };
  }
  return { ok: true };
}

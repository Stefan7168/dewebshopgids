// Every per-agent Postgres login role (plan section 7). Migration 0006 creates them
// NOLOGIN; set-role-password.ts enables one, kill-switch.ts disables all.
export const AGENT_ROLES = [
  "agent_scout",
  "agent_auditor",
  "agent_dispute",
  "agent_guide",
  "agent_factcheck",
  "agent_outreach",
  "agent_analyst",
  "agent_ops",
] as const;

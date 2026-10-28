#!/usr/bin/env bash
# Optional shortcut for setup-for-stefan.md steps 2 to 4: puts the three first-night keys where
# they belong, so nothing has to be clicked in GitHub or Vercel. Run it on your own computer from
# the repo folder, after the all-in-one SQL (it prints the pipeline password).
# Needs: gh (logged in: `gh auth login`) and the Vercel CLI (logged in: `npx vercel login`).
# Keys are read without echo and passed on stdin, never as arguments, so they stay out of
# shell history and process lists. Safe to run again: every value is overwritten.
set -euo pipefail

REPO="Stefan7168/dewebshopgids"
PROJECT_REF="khljuorpncjrswgcayow"
VERCEL_PROJECT="dewebshopgids"
VERCEL_SCOPE="stefanpeek01-3883s-projects"
VERCEL="${VERCEL_BIN:-npx --yes vercel@latest}"

ask() { # ask VAR "prompt": read a secret without echo
  local v; read -r -s -p "$2: " v; echo >&2; [ -n "$v" ] || { echo "empty, stopped" >&2; exit 1; }
  printf -v "$1" '%s' "$v"
}

ask SERVICE_KEY "1/3 Supabase secret key (sb_secret_... or the service_role key)"
ask ANTHROPIC_KEY "2/3 Anthropic API key (sk-ant-...)"
ask POOLER_URL "3/3 Session pooler connection string from Supabase > Connect (with [YOUR-PASSWORD] in it)"
ask PIPELINE_PW "    Pipeline password from the SQL result"

case "$POOLER_URL" in *"postgres.$PROJECT_REF"*) ;; *) echo "pooler string must contain postgres.$PROJECT_REF" >&2; exit 1 ;; esac
PIPELINE_URL="${POOLER_URL/postgres.$PROJECT_REF/pipeline.$PROJECT_REF}"
PIPELINE_URL="${PIPELINE_URL/\[YOUR-PASSWORD\]/$PIPELINE_PW}"
case "$PIPELINE_URL" in *YOUR-PASSWORD*) echo "could not fill in the password" >&2; exit 1 ;; esac

echo "GitHub: environment 'production', deployable from main only"
gh api -X PUT "repos/$REPO/environments/production" --input - >/dev/null <<'JSON'
{"deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}}
JSON
gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" -f name=main >/dev/null 2>&1 || true
printf '%s' "$ANTHROPIC_KEY" | gh secret set ANTHROPIC_API_KEY --env production --repo "$REPO"
printf '%s' "$PIPELINE_URL" | gh secret set PIPELINE_DATABASE_URL --env production --repo "$REPO"

echo "Vercel: SUPABASE_SERVICE_ROLE_KEY (Production and Preview, sensitive)"
$VERCEL link --yes --project "$VERCEL_PROJECT" --scope "$VERCEL_SCOPE" >/dev/null
for target in production preview; do
  $VERCEL env rm SUPABASE_SERVICE_ROLE_KEY "$target" --yes --scope "$VERCEL_SCOPE" >/dev/null 2>&1 || true
  printf '%s' "$SERVICE_KEY" | $VERCEL env add SUPABASE_SERVICE_ROLE_KEY "$target" --sensitive --yes --scope "$VERCEL_SCOPE" >/dev/null
done

echo "Done. Vercel picks up the key on the next deployment; Claude redeploys after your \"done\"."
echo "Reply \"done\" in the build thread."

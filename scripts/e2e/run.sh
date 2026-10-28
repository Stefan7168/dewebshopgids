#!/usr/bin/env bash
# End-to-end run of the nightly pipeline, scoring, publishing, email queue and the weekly gids
# against a fresh local database, with fixture websites and a fake Anthropic client. No network.
# Usage (as for npm run test:db): PGHOST=... PGPORT=... PGUSER=postgres scripts/e2e/run.sh
# Never point this at the real project: it drops the e2e database.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB="${E2E_DB:-dewebshopgids_e2e}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }
run supabase/tests/bootstrap_local.sql
for f in supabase/migrations/*.sql; do run "$f"; done

# Local-only passwords; the roles are cluster-wide, so they are switched off again at the end.
PW="e2e-$(date +%s)"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c "alter role pipeline login password '$PW'"
trap 'psql -q -d "$DB" -c "alter role pipeline nologin password null" >/dev/null' EXIT

# The pipeline role logs in with a password, so over TCP; the admin connection reuses PG* settings.
TCPHOST="${PGHOST:-localhost}"; case "$TCPHOST" in /*) TCPHOST=localhost ;; esac
export E2E_PIPELINE_URL="postgres://pipeline:$PW@$TCPHOST:${PGPORT:-5432}/$DB"
export E2E_DB="$DB"
npx tsx scripts/e2e/nightly.e2e.ts

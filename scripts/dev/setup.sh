#!/usr/bin/env bash
# One-command local setup: a dev database with every migration and demo shops, for
# `npm run dev:local`. Needs a local Postgres 16 you can reach as a superuser
# (PGHOST, PGPORT, PGUSER, as for `npm run test:db`). Never point this at the real project.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB="${DEV_DB:-dewebshopgids_dev}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }
run supabase/tests/bootstrap_local.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run scripts/dev/demo-seed.sql
echo "dev database $DB ready: $(psql -At -d "$DB" -c "select count(*) from public.shops where status = 'published'") published demo shops"

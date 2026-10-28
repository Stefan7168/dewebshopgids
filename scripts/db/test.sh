#!/usr/bin/env bash
# Applies every migration to a fresh local database and runs the SQL tests.
# Usage: PGHOST=... PGPORT=... PGUSER=postgres scripts/db/test.sh
# Never point this at the real Supabase project: it drops the test database.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB="${TEST_DB:-dewebshopgids_test}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"

run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }

run supabase/tests/bootstrap_local.sql
for f in supabase/migrations/*.sql; do
  echo "migrate: $f"
  run "$f"
done
for f in supabase/tests/*.test.sql; do
  echo "test:    $f"
  psql -v ON_ERROR_STOP=1 -q -o /dev/null -d "$DB" -f "$f"
done
echo "db tests passed"

#!/usr/bin/env bash
# `npm run dev:local`: the site on http://localhost:3000 with the demo data from `npm run db:dev`.
# Starts the local REST stand-in (scripts/dev/rest.ts) and points the public reads at it.
# Admin, forms and /go need the real Supabase and are not served locally.
set -euo pipefail
cd "$(dirname "$0")/../.."
npx tsx scripts/dev/rest.ts &
REST=$!
trap 'kill $REST 2>/dev/null' EXIT
NEXT_PUBLIC_SUPABASE_URL=http://localhost:${REST_PORT:-54321} NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local SUPABASE_SERVICE_ROLE_KEY= npx next dev "$@"

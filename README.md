# dewebshopgids.nl

Directory of unique and trustworthy Dutch webshops, maintained by AI agents. See `CLAUDE.md` for how to work in this repo and `docs/plan.md` for the plan.

## Run locally

With demo data and no Supabase account (needs a local Postgres 16, see `docs/runbook.md` section 6):

```bash
npm install
npm run db:dev
npm run dev:local
```

Against the real Supabase project:

```bash
cp .env.example .env.local   # fill in the Supabase publishable key
npm install
npm run dev
```

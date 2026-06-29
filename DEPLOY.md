# Deployment Handoff

Use this prompt in a new Claude Code session to complete deployment:

---

## Prompt

```
I'm deploying "Engineer Daily" — a Cloudflare Worker + React frontend monorepo.
The project is at: c:\Projects\exploring_claude\engineer'sday

Everything is built and working locally. Here's exactly what remains before it's live:

---

STEP 1 — Cloudflare login
Run: cd apps/worker && npx wrangler login
This opens a browser OAuth flow. Wait for it to complete.

---

STEP 2 — Create KV namespaces
From apps/worker, run:
  npx wrangler kv namespace create "KV"
  npx wrangler kv namespace create "KV" --preview

Each command prints a namespace ID. Update apps/worker/wrangler.toml:
  id = "<production-id-from-first-command>"
  preview_id = "<preview-id-from-second-command>"

---

STEP 3 — Deploy the Worker
From apps/worker:
  npx wrangler deploy

Note the deployed URL printed at the end — looks like:
  https://engineer-daily-worker.<account>.workers.dev

---

STEP 4 — Build and deploy the frontend
From apps/web, run the build with the worker URL set:
  VITE_API_URL=https://engineer-daily-worker.<account>.workers.dev npm run build

Then deploy to Cloudflare Pages:
  npx wrangler pages deploy dist --project-name engineer-daily

---

STEP 5 — Verify
  curl https://engineer-daily-worker.<account>.workers.dev/api/concepts
  curl https://engineer-daily-worker.<account>.workers.dev/api/daily

The /api/daily will return an error until 05:30 UTC fires the first time.
To seed it immediately run:
  curl https://engineer-daily-worker.<account>.workers.dev/_cron/hourly
  (wait 5 seconds)
  curl https://engineer-daily-worker.<account>.workers.dev/_cron/daily

Wait — /_cron/* routes are disabled in production (ENVIRONMENT=production).
To seed on first deploy, temporarily change wrangler.toml ENVIRONMENT to "development",
deploy, seed, then change back to "production" and redeploy.

---

KEY FILES:
- apps/worker/wrangler.toml — KV namespace IDs go here (Step 2)
- apps/worker/src/index.ts — API router, all endpoints
- apps/worker/src/knowledge/loader.ts — imports companies/concepts/questions as bundled JSON (no KV seeding needed for knowledge base)
- apps/web/src/lib/api.ts — uses VITE_API_URL env var for production API base URL
- apps/web/vite.config.ts — proxies /api to localhost:8788 in dev
- data/companies.json, data/concepts.json, data/questions.json — knowledge base (bundled at build time)

ARCHITECTURE:
- Hourly cron (0 * * * *): fetches all RSS feeds, writes to KV with 2h TTL
- Daily cron (30 5 * * *): scores/deduplicates articles, locks daily picks in KV
- Knowledge base (companies, concepts, questions) is bundled into the worker binary — no seeding needed
- Frontend uses localStorage for user progress (streak, bookmarks, read history) — no auth

COMPLETED FIXES (already in the code):
- KV namespace IDs are still dummy values (00000000000000000000000000000001) — fix in Step 2
- VITE_API_URL already wired into api.ts
- wrangler.toml already set to ENVIRONMENT=production
- Vite proxy already pointed to correct port 8788
- Knowledge base already bundled into worker (no manual kv seeding required)

Please complete Steps 1-5 in order and verify the frontend loads correctly at the Pages URL.
```

# Engineer Daily

A curated daily learning OS for software engineers. Every morning at 05:30 UTC the curation engine locks a fresh set of articles, a company deep-dive, a concept reference, and an interview question — the newspaper model for technical growth.

## Stack

| Layer | Tech |
|---|---|
| Backend | Cloudflare Worker (TypeScript) |
| Storage | Cloudflare KV |
| Cron | Cloudflare Cron Triggers |
| Frontend | React + Vite + Tailwind + TanStack Query |
| Deployment | Cloudflare Workers + Cloudflare Pages |

## Project Structure

```
engineer-daily/
├── apps/
│   ├── worker/          # Cloudflare Worker — API + feed engine + curation
│   │   ├── src/
│   │   │   ├── index.ts            # API router
│   │   │   ├── scheduler.ts        # Cron handlers (hourly refresh + daily curation)
│   │   │   ├── fetcher.ts          # Per-category RSS feed fetcher
│   │   │   ├── feeds/              # RSS/Atom parser + feed sources
│   │   │   ├── curation/           # Scoring, deduplication, daily pick selection
│   │   │   └── knowledge/          # Bundled companies/concepts/questions loader
│   │   └── wrangler.toml
│   └── web/             # React frontend
│       ├── src/
│       │   ├── pages/              # Home, Feed, Companies, Concepts, Bookmarks
│       │   ├── components/         # ArticleCard, ConceptCard, ReaderPanel, Sidebar
│       │   ├── hooks/useProgress.ts # Streak, bookmarks, read history (localStorage)
│       │   └── lib/api.ts          # API client
│       └── vite.config.ts
└── data/
    ├── companies.json   # 20 curated companies (bundled into worker at build time)
    ├── concepts.json    # 15 engineering concepts (bundled into worker at build time)
    └── questions.json   # 12 interview questions (bundled into worker at build time)
```

## How It Works

- **Hourly cron** (`0 * * * *`): fetches all RSS/Atom feeds across 9 categories, normalizes articles, writes to KV with 2h TTL
- **Daily cron** (`30 5 * * *`): reads today's feeds, scores articles (recency 40% + quality 40% + source rep 20%), deduplicates, picks 5–8 balanced articles + today's company + concept + interview question, locks in KV for 48h
- **Knowledge base** (companies, concepts, questions) is bundled directly into the worker binary — no seeding needed, auto-updates on deploy
- **User progress** (streak, bookmarks, read history) lives in `localStorage` — no auth required

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
npm install
```

### 2. Start both servers

```bash
npm run dev
```

- Worker API: `http://localhost:8788`
- Frontend: `http://localhost:5174` (or 5173 if available)

### 3. Seed local data and trigger curation

The cron doesn't auto-fire in local dev. Run this once after starting the servers (and after any restart):

```bash
curl http://localhost:8788/_cron/hourly   # fetch feeds (~5s)
sleep 5
curl http://localhost:8788/_cron/daily    # curate daily picks
```

Then open `http://localhost:5174` — the homepage should show today's picks.

> **One-liner version:**
> ```bash
> curl -s http://127.0.0.1:8788/_cron/hourly && sleep 5 && curl -s http://127.0.0.1:8788/_cron/daily
> ```

### 4. Updating the knowledge base

Edit `data/companies.json`, `data/concepts.json`, or `data/questions.json` — changes are picked up automatically on the next server restart (data is bundled, not read from KV).

## Deployment

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- Wrangler CLI logged in: `npx wrangler login`

### Step 1 — Create KV namespaces

```bash
cd apps/worker
npx wrangler kv namespace create "KV"
npx wrangler kv namespace create "KV" --preview
```

Copy the two namespace IDs from the output and update `apps/worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "<production-namespace-id>"
preview_id = "<preview-namespace-id>"
```

### Step 2 — Deploy the Worker

```bash
cd apps/worker
npx wrangler deploy
```

Note the deployed Worker URL — it will look like:
`https://engineer-daily-worker.<your-account>.workers.dev`

### Step 3 — Deploy the Frontend

```bash
cd apps/web
VITE_API_URL=https://engineer-daily-worker.<your-account>.workers.dev npm run build
npx wrangler pages deploy dist --project-name engineer-daily
```

> On first run, `wrangler pages deploy` will create the Pages project automatically.

The frontend URL will be: `https://engineer-daily.pages.dev`

### Step 4 — Verify

```bash
# Check the worker is live
curl https://engineer-daily-worker.<your-account>.workers.dev/api/concepts | head -c 200

# Check daily picks (may be empty until 05:30 UTC fires)
curl https://engineer-daily-worker.<your-account>.workers.dev/api/daily
```

The cron will fire automatically at 05:30 UTC on the first morning after deployment.

## API Reference

| Endpoint | Description |
|---|---|
| `GET /api/daily` | Today's curated picks (articles + company + concept + question) |
| `GET /api/feed?category=AI` | Raw feed articles for a category |
| `GET /api/companies` | All companies in the knowledge base |
| `GET /api/company/:id` | Single company |
| `GET /api/concepts` | All concepts |
| `GET /api/concept/:id` | Single concept |
| `GET /api/search?q=kafka` | Search across today's articles |
| `GET /_cron/hourly` | Manually trigger feed refresh (dev only) |
| `GET /_cron/daily` | Manually trigger daily curation (dev only) |

## Environment Variables

### Worker (`apps/worker/wrangler.toml`)

| Variable | Value | Notes |
|---|---|---|
| `ENVIRONMENT` | `production` | Controls `/_cron/*` dev endpoints (disabled in production) |

### Worker local dev (`apps/worker/.dev.vars`)

| Variable | Value |
|---|---|
| `ENVIRONMENT` | `development` |

### Frontend (set at build time)

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_URL` | `https://engineer-daily-worker.xyz.workers.dev` | Leave unset for local dev (Vite proxy handles it) |

## Adding Content

### New company

Edit `data/companies.json` — follow the existing schema. Redeploy worker.

### New concept

Edit `data/concepts.json` — or run the generation script (if built):
```bash
npx tsx scripts/generate-concepts.ts
```
Review output, merge into `data/concepts.json`, redeploy worker.

### New RSS feed source

Edit `apps/worker/src/feeds/sources.ts` — add a `FeedSource` entry. Redeploy worker.

## What's Automated vs Manual

| Task | Automated | How |
|---|---|---|
| Fetch RSS feeds | Yes — every hour | Cloudflare Cron `0 * * * *` |
| Curate daily picks | Yes — 05:30 UTC | Cloudflare Cron `30 5 * * *` |
| Expire old feed cache | Yes — 2h TTL | KV built-in |
| Expire old daily picks | Yes — 48h TTL | KV built-in |
| Update knowledge base | On deploy | Edit JSON → `wrangler deploy` |
| Add new feed sources | On deploy | Edit sources.ts → `wrangler deploy` |

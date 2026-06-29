import type { Env, Article, Category } from "./types";
import { runHourlyRefresh, runDailyCuration } from "./scheduler";
import { getCompanies, getConcepts } from "./knowledge/loader";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200, cache = 300): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cache}`,
      ...CORS_HEADERS,
    },
  });
}

function notFound(msg = "Not found"): Response {
  return json({ error: msg }, 404, 0);
}

// ── Route handlers ──────────────────────────────────────────────────────────

async function handleDaily(env: Env): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await env.KV.get(`daily:${today}`);
  if (!raw) return json({ error: "Daily picks not yet generated. Try again after 05:30 UTC." }, 503, 0);
  return json(JSON.parse(raw), 200, 300);
}

async function handleFeedCategory(category: string, env: Env): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await env.KV.get(`feed:${category}:${today}`);
  if (!raw) return json([], 200, 300);
  const articles = JSON.parse(raw) as Article[];
  // Sort by date desc before returning
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return json(articles.slice(0, 30), 200, 300);
}

async function handleCompany(id: string, env: Env): Promise<Response> {
  const companies = await getCompanies(env);
  const company = companies.find((c) => c.id === id);
  if (!company) return notFound("Company not found");
  return json(company, 200, 3600);
}

async function handleCompanies(env: Env): Promise<Response> {
  const companies = await getCompanies(env);
  return json(companies, 200, 3600);
}

async function handleConcepts(env: Env): Promise<Response> {
  const concepts = await getConcepts(env);
  return json(concepts, 200, 3600);
}

async function handleConcept(id: string, env: Env): Promise<Response> {
  const concepts = await getConcepts(env);
  const concept = concepts.find((c) => c.id === id);
  if (!concept) return notFound("Concept not found");
  return json(concept, 200, 3600);
}

async function handleSearch(query: string, env: Env): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const categories: Category[] = [
    "AI", "Engineering", "Cloud", "Databases", "Distributed Systems",
    "Open Source", "Startups", "Security", "Research",
  ];

  const allArticles = (
    await Promise.all(
      categories.map(async (cat) => {
        const raw = await env.KV.get(`feed:${cat}:${today}`);
        return raw ? (JSON.parse(raw) as Article[]) : [];
      })
    )
  ).flat();

  const q = query.toLowerCase();
  const results = allArticles
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))
    )
    .slice(0, 20);

  return json(results, 200, 120);
}

// ── Main export ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (path === "/api/daily") return handleDaily(env);
    if (path === "/api/feed" && url.searchParams.has("category")) {
      return handleFeedCategory(url.searchParams.get("category")!, env);
    }
    if (path.startsWith("/api/company/")) {
      const id = path.slice("/api/company/".length);
      return id ? handleCompany(id, env) : handleCompanies(env);
    }
    if (path === "/api/companies") return handleCompanies(env);
    if (path === "/api/concepts") return handleConcepts(env);
    if (path.startsWith("/api/concept/")) {
      return handleConcept(path.slice("/api/concept/".length), env);
    }
    if (path === "/api/search") {
      const q = url.searchParams.get("q") ?? "";
      if (q.length < 2) return json([]);
      return handleSearch(q, env);
    }

    // Internal: allow manual cron trigger during dev
    if (path === "/_cron/hourly" && env.ENVIRONMENT !== "production") {
      await runHourlyRefresh(env);
      return json({ ok: true });
    }
    if (path === "/_cron/daily" && env.ENVIRONMENT !== "production") {
      await runDailyCuration(env);
      return json({ ok: true });
    }

    return notFound();
  },

  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // cron: "0 * * * *"  → hourly feed refresh
    // cron: "30 5 * * *" → daily curation
    if (controller.cron === "30 5 * * *") {
      await runDailyCuration(env);
    } else {
      await runHourlyRefresh(env);
    }
  },
} satisfies ExportedHandler<Env>;

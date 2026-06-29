/**
 * Cron-triggered scheduler.
 * - Every hour (0 * * * *): fans out to fetchCategory() for each category.
 * - Daily at 05:30 UTC (30 5 * * *): reads refreshed feeds, runs curation, writes daily pick.
 */
import type { Category, Env, Article } from "./types";
import { fetchCategory } from "./fetcher";
import { buildDailyPick } from "./curation/curate";
import {
  getCompanies,
  getConcepts,
  getInterviewQuestions,
  pickForDay,
  toCompanySnippet,
  toConceptSnippet,
} from "./knowledge/loader";

const ALL_CATEGORIES: Category[] = [
  "AI",
  "Engineering",
  "Cloud",
  "Databases",
  "Distributed Systems",
  "Open Source",
  "Startups",
  "Security",
  "Research",
];

const DAILY_PICK_TTL = 172_800; // 48 hours

export async function runHourlyRefresh(env: Env): Promise<void> {
  // Fan out: fetch all categories in parallel (each is a separate async task)
  await Promise.allSettled(
    ALL_CATEGORIES.map((cat) => fetchCategory(cat, env))
  );
}

export async function runDailyCuration(env: Env): Promise<void> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  // Collect all cached articles from today's feed keys
  const allArticles: Article[] = (
    await Promise.all(
      ALL_CATEGORIES.map(async (cat) => {
        const raw = await env.KV.get(`feed:${cat}:${dateStr}`);
        return raw ? (JSON.parse(raw) as Article[]) : [];
      })
    )
  ).flat();

  // Load knowledge base
  const [companies, concepts, questions] = await Promise.all([
    getCompanies(env),
    getConcepts(env),
    getInterviewQuestions(env),
  ]);

  const company = pickForDay(companies, today);
  const concept = pickForDay(concepts, today);
  const question = pickForDay(questions, today);

  if (!company || !concept || !question) {
    // Knowledge base not seeded yet — skip curation
    return;
  }

  const dailyPick = buildDailyPick(
    allArticles,
    toCompanySnippet(company),
    toConceptSnippet(concept),
    question,
    dateStr
  );

  await env.KV.put(`daily:${dateStr}`, JSON.stringify(dailyPick), {
    expirationTtl: DAILY_PICK_TTL,
  });
}

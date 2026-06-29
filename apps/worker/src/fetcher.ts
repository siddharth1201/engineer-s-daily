/**
 * Per-category fetch worker.
 * Invoked via internal fetch() subrequest from the scheduler.
 * Fetches all feeds for a given category, normalizes, writes to KV.
 */
import { parseFeed } from "./feeds/parser";
import { SOURCES } from "./feeds/sources";
import type { Article, Category, Env } from "./types";
const FEED_TTL_SECONDS = 7200; // 2 hours

export async function fetchCategory(category: Category, env: Env): Promise<number> {
  const sources = SOURCES.filter((s) => s.category === category);

  const results = await Promise.allSettled(sources.map((src) => parseFeed(src)));

  const articles: Article[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  const today = new Date().toISOString().slice(0, 10);
  const key = `feed:${category}:${today}`;

  await env.KV.put(key, JSON.stringify(articles), {
    expirationTtl: FEED_TTL_SECONDS,
  });

  return articles.length;
}

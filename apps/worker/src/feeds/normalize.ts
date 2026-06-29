import type { Article, FeedSource } from "../types";

function hashUrl(url: string): string {
  // Simple djb2 hash — deterministic, no crypto needed
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) + hash) ^ url.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)); // 200 wpm average
}

function extractTags(title: string, summary: string): string[] {
  const combined = `${title} ${summary}`.toLowerCase();
  const tagMap: Record<string, string[]> = {
    "distributed-systems": ["distributed", "consensus", "raft", "paxos", "zookeeper"],
    kubernetes: ["kubernetes", "k8s", "helm", "pod", "container"],
    "machine-learning": ["machine learning", "ml", "neural", "model", "training", "llm"],
    database: ["database", "sql", "nosql", "postgres", "mysql", "mongodb"],
    performance: ["performance", "latency", "throughput", "optimization", "profiling"],
    security: ["security", "vulnerability", "cve", "exploit", "auth"],
    "open-source": ["open source", "open-source", "github", "oss", "apache"],
    cloud: ["aws", "gcp", "azure", "cloud", "serverless", "lambda"],
    rust: ["rust", "cargo", "rustlang"],
    golang: ["golang", "go lang", "goroutine"],
    typescript: ["typescript", "tsx", "type-safe"],
    react: ["react", "reactjs", "react native"],
  };

  return Object.entries(tagMap)
    .filter(([, keywords]) => keywords.some((kw) => combined.includes(kw)))
    .map(([tag]) => tag)
    .slice(0, 5);
}

function scoreQuality(title: string, summary: string, source: FeedSource): number {
  let score = source.reputationScore;

  const combinedLength = title.length + summary.length;
  if (combinedLength > 300) score += 0.05;
  if (summary.length > 200) score += 0.03;

  // Penalize clickbait patterns
  const clickbait = /\b(you won't believe|top \d+ reasons|this one trick)\b/i;
  if (clickbait.test(title)) score -= 0.2;

  return Math.min(1, Math.max(0, score));
}

// Accepts a partially-extracted entry with _link, _author etc. fields
export function normalizeArticle(
  entry: Record<string, unknown>,
  source: FeedSource
): Article {
  const title = String(
    (entry["title"] as string | undefined) ?? ""
  ).trim();

  const url = String(
    (entry["_link"] as string | undefined) ??
    (entry["url"] as string | undefined) ??
    (entry["link"] as string | undefined) ??
    ""
  );

  const author = String(
    (entry["_author"] as string | undefined) ??
    (entry["author"] as string | undefined) ??
    source.name
  );

  const date = String(
    (entry["_date"] as string | undefined) ??
    (entry["date_published"] as string | undefined) ??
    new Date().toISOString()
  );

  const summary = String(
    (entry["_summary"] as string | undefined) ??
    (entry["content_text"] as string | undefined) ??
    (entry["summary"] as string | undefined) ??
    ""
  ).slice(0, 280);

  const thumbnail =
    (entry["_thumbnail"] as string | undefined) ??
    (entry["image"] as string | undefined);

  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return source.id;
    }
  })();

  const tags = extractTags(title, summary);
  const qualityScore = scoreQuality(title, summary, source);
  const readTime = estimateReadTime(summary + " " + title);

  return {
    id: hashUrl(url || title),
    title,
    author,
    source: source.name,
    domain,
    date,
    category: source.category,
    summary,
    url,
    thumbnail: thumbnail ?? undefined,
    readTime,
    tags,
    qualityScore,
  };
}

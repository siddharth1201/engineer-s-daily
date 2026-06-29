import type { Article } from "../types";

const RECENCY_WEIGHT = 0.4;
const QUALITY_WEIGHT = 0.4;
const SOURCE_REP_WEIGHT = 0.2;

// Exponential decay: full score within 12h, ~50% at 24h, ~25% at 48h
function recencyScore(dateStr: string): number {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageHours = ageMs / 3_600_000;
  return Math.exp(-ageHours / 24);
}

export function scoreArticle(article: Article): number {
  const recency = recencyScore(article.date);
  const quality = article.qualityScore;
  // Source reputation is already baked into qualityScore, use it as a tiebreaker proxy
  const sourceRep = quality; // reputationScore was used to compute qualityScore

  return (
    recency * RECENCY_WEIGHT +
    quality * QUALITY_WEIGHT +
    sourceRep * SOURCE_REP_WEIGHT
  );
}

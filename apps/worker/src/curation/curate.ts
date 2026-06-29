import type { Article, Category, DailyPick, CompanySnippet, ConceptSnippet, InterviewQuestion } from "../types";
import { scoreArticle } from "./score";
import { isDuplicate } from "./dedup";

// Priority order for category slots — ensures balance
const CATEGORY_PRIORITY: Category[] = [
  "Engineering",
  "AI",
  "Distributed Systems",
  "Cloud",
  "Research",
  "Startups",
  "Databases",
  "Security",
  "Open Source",
  "Videos",
];

const MIN_PICKS = 5;
const MAX_PICKS = 8;
const MIN_QUALITY_THRESHOLD = 0.4;

export function selectDailyArticles(allArticles: Article[]): Article[] {
  // Sort all candidates by computed score descending
  const scored = allArticles
    .filter((a) => a.qualityScore >= MIN_QUALITY_THRESHOLD && a.url)
    .map((a) => ({ article: a, score: scoreArticle(a) }))
    .sort((a, b) => b.score - a.score);

  const selected: Article[] = [];
  const selectedTitles: string[] = [];
  const usedCategories = new Set<Category>();

  // Pass 1: one best article per category in priority order
  for (const category of CATEGORY_PRIORITY) {
    if (selected.length >= MAX_PICKS) break;

    const candidate = scored.find(
      ({ article }) =>
        article.category === category &&
        !isDuplicate(article.title, selectedTitles)
    );

    if (candidate) {
      selected.push(candidate.article);
      selectedTitles.push(candidate.article.title);
      usedCategories.add(category);
    }
  }

  // Pass 2: fill remaining slots with highest-scoring non-duplicate articles
  if (selected.length < MIN_PICKS) {
    for (const { article } of scored) {
      if (selected.length >= MAX_PICKS) break;
      if (selected.some((s) => s.id === article.id)) continue;
      if (isDuplicate(article.title, selectedTitles)) continue;

      selected.push(article);
      selectedTitles.push(article.title);
    }
  }

  return selected;
}

export function buildDailyPick(
  articles: Article[],
  company: CompanySnippet,
  concept: ConceptSnippet,
  question: InterviewQuestion,
  date: string
): DailyPick {
  return {
    date,
    articles: selectDailyArticles(articles),
    company,
    concept,
    interviewQuestion: question,
  };
}

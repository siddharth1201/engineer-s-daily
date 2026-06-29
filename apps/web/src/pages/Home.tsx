import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import type { Article } from "../lib/types";
import { ArticleCard } from "../components/ArticleCard";
import { CompanyCard } from "../components/CompanyCard";
import { ConceptCard } from "../components/ConceptCard";
import { InterviewCard } from "../components/InterviewCard";
import { ReaderPanel } from "../components/ReaderPanel";
import { useProgress } from "../hooks/useProgress";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateLong(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function Home() {
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const { streak, isRead, isBookmarked, markRead, toggleBookmark } = useProgress();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["daily"],
    queryFn: api.daily,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  function openArticle(article: Article) {
    setActiveArticle(article);
    markRead(article.id);
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-muted">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-sm">Loading your daily briefing…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-muted px-6 text-center">
        <p className="text-sm font-medium text-ink">Daily picks not ready yet</p>
        <p className="text-xs">
          The curation engine runs at 05:30 UTC. Check back shortly, or browse categories in the sidebar.
        </p>
      </div>
    );
  }

  const articlesRead = data.articles.filter((a) => isRead(a.id)).length;
  const total = data.articles.length;

  return (
    <>
      <div className="flex-1 flex flex-col gap-6 px-6 py-6 max-w-3xl">
        {/* Hero */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">
                {greeting()}
              </h2>
              <p className="text-sm text-ink-muted mt-0.5">{formatDateLong()}</p>
            </div>
            <div className="text-right">
              {streak > 0 && (
                <p className="text-sm font-medium text-amber-500">🔥 {streak} day streak</p>
              )}
              <p className="text-xs text-ink-faint mt-0.5">
                {articlesRead}/{total} read today
              </p>
            </div>
          </div>

          {/* Reading progress bar */}
          <div className="mt-3 h-1 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 rounded-full"
              style={{ width: total > 0 ? `${(articlesRead / total) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Top cards: company + concept side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CompanyCard company={data.company} />
          <ConceptCard concept={data.concept} />

        </div>

        {/* Interview question */}
        <InterviewCard question={data.interviewQuestion} />

        {/* Articles */}
        <div>
          <h3 className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
            Today's Reading — {total} curated articles
          </h3>
          <div className="flex flex-col gap-2">
            {data.articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isRead={isRead(article.id)}
                isBookmarked={isBookmarked(article.id)}
                onOpen={openArticle}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
        </div>
      </div>

      <ReaderPanel
        article={activeArticle}
        isBookmarked={activeArticle ? isBookmarked(activeArticle.id) : false}
        onClose={() => setActiveArticle(null)}
        onBookmark={toggleBookmark}
        onRead={markRead}
      />
    </>
  );
}

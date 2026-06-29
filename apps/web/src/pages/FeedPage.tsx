import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Article, Category } from "../lib/types";
import { ArticleCard } from "../components/ArticleCard";
import { ReaderPanel } from "../components/ReaderPanel";
import { useProgress } from "../hooks/useProgress";

export function FeedPage() {
  const { category } = useParams<{ category: string }>();
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const { isRead, isBookmarked, markRead, toggleBookmark } = useProgress();

  const { data, isLoading } = useQuery({
    queryKey: ["feed", category],
    queryFn: () => api.feed(category as Category),
    enabled: Boolean(category),
    staleTime: 5 * 60 * 1000,
  });

  function openArticle(article: Article) {
    setActiveArticle(article);
    markRead(article.id);
  }

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 px-6 py-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold text-ink">{category}</h2>
          <p className="text-xs text-ink-muted mt-0.5">Latest from today's feeds</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-ink-muted py-8">
            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data && data.length > 0 ? (
              data.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isRead={isRead(article.id)}
                  isBookmarked={isBookmarked(article.id)}
                  onOpen={openArticle}
                  onBookmark={toggleBookmark}
                />
              ))
            ) : (
              <p className="text-sm text-ink-muted py-8 text-center">
                No articles cached yet. The feed refreshes every hour.
              </p>
            )}
          </div>
        )}
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

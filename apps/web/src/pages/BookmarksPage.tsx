import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import type { Article } from "../lib/types";
import { ArticleCard } from "../components/ArticleCard";
import { ReaderPanel } from "../components/ReaderPanel";
import { useProgress } from "../hooks/useProgress";

export function BookmarksPage() {
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const { bookmarks, isRead, isBookmarked, markRead, toggleBookmark } = useProgress();

  const { data: daily } = useQuery({
    queryKey: ["daily"],
    queryFn: api.daily,
    staleTime: 5 * 60 * 1000,
  });

  const bookmarkedArticles =
    daily?.articles.filter((a) => bookmarks.includes(a.id)) ?? [];

  function openArticle(article: Article) {
    setActiveArticle(article);
    markRead(article.id);
  }

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 px-6 py-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold text-ink">Saved Articles</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {bookmarkedArticles.length} bookmark{bookmarkedArticles.length !== 1 ? "s" : ""}
          </p>
        </div>

        {bookmarkedArticles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-ink-muted">No bookmarks yet.</p>
            <p className="text-xs text-ink-faint mt-1">
              Click the bookmark icon on any article to save it here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bookmarkedArticles.map((article) => (
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

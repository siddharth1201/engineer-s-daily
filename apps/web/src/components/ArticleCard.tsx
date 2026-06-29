import { CategoryBadge } from "./CategoryBadge";
import type { Article } from "../lib/types";

interface Props {
  article: Article;
  isRead: boolean;
  isBookmarked: boolean;
  onOpen: (article: Article) => void;
  onBookmark: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3_600_000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ArticleCard({ article, isRead, isBookmarked, onOpen, onBookmark }: Props) {
  return (
    <article
      onClick={() => onOpen(article)}
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150
        ${isRead
          ? "border-border bg-surface-1 opacity-60 hover:opacity-80"
          : "border-border bg-surface-1 hover:bg-surface-2 hover:border-accent/30"
        }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={`https://www.google.com/s2/favicons?domain=${article.domain}&sz=16`}
            alt=""
            className="w-4 h-4 rounded shrink-0 opacity-70"
            loading="lazy"
          />
          <span className="text-xs text-ink-muted truncate">{article.source}</span>
          <span className="text-xs text-ink-faint">{formatDate(article.date)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CategoryBadge category={article.category} />
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors
          ${isRead ? "text-ink-muted" : "text-ink group-hover:text-accent"}`}
      >
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-ink-faint">{article.readTime} min read</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(article.id);
          }}
          className={`p-1 rounded transition-colors ${
            isBookmarked
              ? "text-accent"
              : "text-ink-faint hover:text-ink-muted"
          }`}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {isRead && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-accent/50" />
      )}
    </article>
  );
}

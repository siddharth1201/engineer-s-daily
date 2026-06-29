import { useEffect } from "react";
import type { Article } from "../lib/types";
import { CategoryBadge } from "./CategoryBadge";

interface Props {
  article: Article | null;
  isBookmarked: boolean;
  onClose: () => void;
  onBookmark: (id: string) => void;
  onRead: (id: string) => void;
}

function formatDateFull(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ReaderPanel({ article, isBookmarked, onClose, onBookmark, onRead }: Props) {
  // Mark as read when opened
  useEffect(() => {
    if (article) onRead(article.id);
  }, [article?.id, onRead]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!article) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface-0 border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={`https://www.google.com/s2/favicons?domain=${article.domain}&sz=16`}
              alt=""
              className="w-4 h-4 shrink-0 opacity-70"
            />
            <span className="text-xs text-ink-muted truncate">{article.source}</span>
          </div>

          <button
            onClick={() => onBookmark(article.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? "text-accent bg-accent-muted"
                : "text-ink-muted hover:text-ink hover:bg-surface-2"
            }`}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          <span className="text-xs text-ink-faint shrink-0 px-1">Esc to close</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">
            {/* Category + meta */}
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={article.category} />
              <span className="text-xs text-ink-faint">{article.readTime} min read</span>
              <span className="text-xs text-ink-faint">·</span>
              <span className="text-xs text-ink-faint">{formatDateFull(article.date)}</span>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-ink leading-snug">
              {article.title}
            </h2>

            {/* Author */}
            {article.author && (
              <p className="text-xs text-ink-muted -mt-3">by {article.author}</p>
            )}

            {/* Thumbnail */}
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt=""
                className="w-full rounded-xl object-cover max-h-48"
                loading="lazy"
              />
            )}

            {/* Summary */}
            {article.summary ? (
              <div className="bg-surface-1 rounded-xl p-4 border border-border">
                <p className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">Summary</p>
                <p className="text-sm text-ink-muted leading-relaxed">{article.summary}</p>
              </div>
            ) : null}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-ink-faint"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Read CTA */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 active:scale-[0.98] transition-all"
            >
              Read full article
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Source link */}
            <p className="text-center text-xs text-ink-faint">
              on{" "}
              <a
                href={`https://${article.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink-muted underline underline-offset-2"
              >
                {article.domain}
              </a>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

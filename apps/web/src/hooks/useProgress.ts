import { useCallback, useEffect, useState } from "react";

interface ProgressState {
  streak: number;
  lastReadDate: string | null;
  articlesRead: string[];
  bookmarks: string[];
  notes: Record<string, string>;
  theme: "dark" | "light";
}

const STORAGE_KEY = "ed:progress";
const today = () => new Date().toISOString().slice(0, 10);

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressState;
  } catch {
    // corrupted storage — reset
  }
  return {
    streak: 0,
    lastReadDate: null,
    articlesRead: [],
    bookmarks: [],
    notes: {},
    theme: "dark",
  };
}

function save(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(load);

  // Sync theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  const update = useCallback((patch: Partial<ProgressState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const markRead = useCallback(
    (articleId: string) => {
      const todayStr = today();
      setState((prev) => {
        const alreadyRead = prev.articlesRead.includes(articleId);
        if (alreadyRead) return prev;

        // Streak logic: increment if yesterday was last read date, reset otherwise
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        let streak = prev.streak;
        if (prev.lastReadDate === null || prev.lastReadDate === todayStr) {
          // First ever read OR already read today — maintain streak
          streak = prev.lastReadDate === null ? 1 : prev.streak;
        } else if (prev.lastReadDate === yesterdayStr) {
          streak = prev.streak + 1;
        } else {
          streak = 1; // streak broken
        }

        const next: ProgressState = {
          ...prev,
          streak,
          lastReadDate: todayStr,
          articlesRead: [...prev.articlesRead, articleId],
        };
        save(next);
        return next;
      });
    },
    []
  );

  const toggleBookmark = useCallback((articleId: string) => {
    setState((prev) => {
      const bookmarks = prev.bookmarks.includes(articleId)
        ? prev.bookmarks.filter((b) => b !== articleId)
        : [...prev.bookmarks, articleId];
      const next = { ...prev, bookmarks };
      save(next);
      return next;
    });
  }, []);

  const setNote = useCallback((articleId: string, note: string) => {
    setState((prev) => {
      const next = { ...prev, notes: { ...prev.notes, [articleId]: note } };
      save(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    update({ theme: state.theme === "dark" ? "light" : "dark" });
  }, [state.theme, update]);

  return {
    streak: state.streak,
    articlesRead: state.articlesRead,
    bookmarks: state.bookmarks,
    notes: state.notes,
    theme: state.theme,
    markRead,
    toggleBookmark,
    setNote,
    toggleTheme,
    isRead: (id: string) => state.articlesRead.includes(id),
    isBookmarked: (id: string) => state.bookmarks.includes(id),
  };
}

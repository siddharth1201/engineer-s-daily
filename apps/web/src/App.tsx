import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./pages/Home";
import { FeedPage } from "./pages/FeedPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { ConceptsPage } from "./pages/ConceptsPage";
import { ConceptDetailPage } from "./pages/ConceptDetailPage";
import { useProgress } from "./hooks/useProgress";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Layout() {
  const { streak, bookmarks, theme, toggleTheme } = useProgress();

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar
        streak={streak}
        bookmarkCount={bookmarks.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed/:category" element={<FeedPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/concepts" element={<ConceptsPage />} />
          <Route path="/concepts/:id" element={<ConceptDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

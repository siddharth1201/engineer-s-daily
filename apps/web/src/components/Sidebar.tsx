import { NavLink } from "react-router-dom";
import type { Category } from "../lib/types";

const NAV_CATEGORIES: { label: Category; icon: string }[] = [
  { label: "AI", icon: "✦" },
  { label: "Engineering", icon: "⚙" },
  { label: "Cloud", icon: "☁" },
  { label: "Databases", icon: "◈" },
  { label: "Distributed Systems", icon: "◎" },
  { label: "Open Source", icon: "⬡" },
  { label: "Startups", icon: "◇" },
  { label: "Security", icon: "⬕" },
  { label: "Research", icon: "◉" },
];

interface Props {
  streak: number;
  bookmarkCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Sidebar({ streak, bookmarkCount, theme, onToggleTheme }: Props) {
  const linkBase =
    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-ink-muted hover:text-ink hover:bg-surface-2";
  const activeLink = "bg-accent-muted text-accent font-medium";

  return (
    <nav className="w-56 shrink-0 flex flex-col gap-1 py-4 px-2 border-r border-border min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Brand */}
      <div className="px-3 mb-4">
        <h1 className="text-sm font-semibold text-ink tracking-tight">Engineer Daily</h1>
        <p className="text-xs text-ink-faint mt-0.5">Your morning briefing</p>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs font-medium text-amber-500">🔥 {streak} day streak</p>
        </div>
      )}

      {/* Primary nav */}
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
      >
        <span className="text-base leading-none">◈</span>
        Today
      </NavLink>

      <NavLink
        to="/bookmarks"
        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
      >
        <span className="text-base leading-none">◇</span>
        Saved
        {bookmarkCount > 0 && (
          <span className="ml-auto text-xs bg-surface-2 text-ink-faint px-1.5 py-0.5 rounded-md">
            {bookmarkCount}
          </span>
        )}
      </NavLink>

      <NavLink
        to="/companies"
        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
      >
        <span className="text-base leading-none">◉</span>
        Companies
      </NavLink>

      <NavLink
        to="/concepts"
        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
      >
        <span className="text-base leading-none">✦</span>
        Concepts
      </NavLink>

      {/* Divider */}
      <div className="my-2 mx-3 border-t border-border" />
      <p className="px-3 text-xs text-ink-faint font-medium uppercase tracking-wide mb-1">
        Browse
      </p>

      {NAV_CATEGORIES.map(({ label, icon }) => (
        <NavLink
          key={label}
          to={`/feed/${encodeURIComponent(label)}`}
          className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
        >
          <span className="text-xs leading-none opacity-70">{icon}</span>
          <span className="truncate">{label}</span>
        </NavLink>
      ))}

      {/* Bottom actions */}
      <div className="mt-auto pt-4 mx-3 flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          {theme === "dark" ? "☀ Light" : "◑ Dark"}
        </button>
      </div>
    </nav>
  );
}

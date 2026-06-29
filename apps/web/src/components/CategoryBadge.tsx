import type { Category } from "../lib/types";

const COLOR: Record<Category, string> = {
  AI: "bg-violet-500/10 text-violet-400 dark:text-violet-300",
  Engineering: "bg-blue-500/10 text-blue-500 dark:text-blue-300",
  Cloud: "bg-sky-500/10 text-sky-500 dark:text-sky-300",
  Databases: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  "Distributed Systems": "bg-orange-500/10 text-orange-500 dark:text-orange-300",
  "Open Source": "bg-green-500/10 text-green-600 dark:text-green-300",
  Startups: "bg-pink-500/10 text-pink-500 dark:text-pink-300",
  Security: "bg-red-500/10 text-red-500 dark:text-red-300",
  Research: "bg-teal-500/10 text-teal-500 dark:text-teal-300",
  Videos: "bg-rose-500/10 text-rose-500 dark:text-rose-300",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${COLOR[category]}`}
    >
      {category}
    </span>
  );
}

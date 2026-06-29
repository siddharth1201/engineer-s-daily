import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Concept } from "../lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Distributed Systems": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Databases":           "bg-amber-500/10  text-amber-400  border-amber-500/20",
  "Engineering":         "bg-blue-500/10   text-blue-400   border-blue-500/20",
  "Security":            "bg-red-500/10    text-red-400    border-red-500/20",
  "AI":                  "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-teal-500/10 text-teal-400 border-teal-500/20";
}

function ConceptGridCard({ concept, onClick }: { concept: Concept; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 hover:border-accent/30 transition-all duration-150 text-left w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink leading-snug">{concept.name}</h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-md border ${categoryColor(concept.category)}`}>
          {concept.category}
        </span>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
        {concept.simpleExplanation}
      </p>
      {concept.companiesUsing.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-auto">
          {concept.companiesUsing.slice(0, 3).map((c) => (
            <span key={c} className="text-xs text-ink-faint bg-surface-2 px-1.5 py-0.5 rounded">
              {c}
            </span>
          ))}
          {concept.companiesUsing.length > 3 && (
            <span className="text-xs text-ink-faint">+{concept.companiesUsing.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

export function ConceptsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("All");

  const { data, isLoading } = useQuery({
    queryKey: ["concepts"],
    queryFn: api.concepts,
    staleTime: 60 * 60 * 1000,
  });

  const categories = ["All", ...Array.from(new Set(data?.map((c) => c.category) ?? []))];
  const filtered = filter === "All" ? (data ?? []) : (data ?? []).filter((c) => c.category === filter);

  return (
    <div className="flex-1 flex flex-col gap-5 px-6 py-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-ink">Concept Explorer</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Deep dives into the ideas that power modern software engineering
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filter === cat
                ? "bg-accent-muted border-accent/30 text-accent font-medium"
                : "border-border bg-surface-1 text-ink-muted hover:bg-surface-2"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-ink-muted py-8">
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((concept) => (
            <ConceptGridCard
              key={concept.id}
              concept={concept}
              onClick={() => navigate(`/concepts/${concept.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

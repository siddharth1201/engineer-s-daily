import { useNavigate } from "react-router-dom";
import type { ConceptSnippet } from "../lib/types";

interface Props {
  concept: ConceptSnippet;
}

const CATEGORY_COLOR: Record<string, string> = {
  "Distributed Systems": "text-orange-400",
  Databases: "text-amber-400",
  Engineering: "text-blue-400",
  Security: "text-red-400",
  AI: "text-violet-400",
};

export function ConceptCard({ concept }: Props) {
  const navigate = useNavigate();
  const color = CATEGORY_COLOR[concept.category] ?? "text-teal-400";

  return (
    <div
      onClick={() => navigate(`/concepts/${concept.id}`)}
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 hover:border-accent/30 cursor-pointer transition-all duration-150"
    >
      <div>
        <p className="text-xs text-ink-faint font-medium uppercase tracking-wide mb-1">Today's Concept</p>
        <h3 className={`text-sm font-semibold ${color}`}>{concept.name}</h3>
        <p className="text-xs text-ink-muted mt-0.5">{concept.category}</p>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{concept.simpleExplanation}</p>
      <p className="text-xs text-accent font-medium">
        Deep dive →
      </p>
    </div>
  );
}

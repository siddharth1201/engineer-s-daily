import type { CompanySnippet } from "../lib/types";

interface Props {
  company: CompanySnippet;
  onClick?: () => void;
}

export function CompanyCard({ company, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 hover:border-accent/30 cursor-pointer transition-all duration-150"
    >
      <div className="flex items-center gap-3">
        <img
          src={company.logo}
          alt={company.name}
          className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="min-w-0">
          <p className="text-xs text-ink-faint font-medium uppercase tracking-wide">Today's Company</p>
          <h3 className="text-sm font-semibold text-ink">{company.name}</h3>
        </div>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{company.tagline}</p>
      <div className="text-xs text-ink-faint border-t border-border pt-3 leading-relaxed italic">
        "{company.interestingFact}"
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import type { Company } from "../lib/types";

function CompanyDetailPanel({
  company,
  onClose,
}: {
  company: Company;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-xl bg-surface-0 border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border sticky top-0 bg-surface-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={company.logo}
            alt={company.name}
            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5"
          />
          <h2 className="text-sm font-semibold text-ink">{company.name}</h2>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div>
            <p className="text-sm text-ink-muted">{company.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Founded", value: String(company.founded) },
              { label: "Founders", value: company.founders.slice(0, 2).join(", ") + (company.founders.length > 2 ? ` +${company.founders.length - 2}` : "") },
              { label: "Business Model", value: company.businessModel },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <p className="text-xs text-ink-faint uppercase tracking-wide">{label}</p>
                <p className="text-xs text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-ink-faint uppercase tracking-wide mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {company.techStack.map((tech) => (
                <span key={tech} className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-ink-muted">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {company.openSourceProjects.length > 0 && (
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide mb-2">Open Source Projects</p>
              <div className="flex flex-wrap gap-1.5">
                {company.openSourceProjects.map((proj) => (
                  <span key={proj} className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-500">
                    {proj}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="italic text-xs text-ink-muted border border-border rounded-lg p-3 leading-relaxed bg-surface-1">
            "{company.interestingFact}"
          </div>

          {company.engineeringBlogUrl && (
            <a
              href={company.engineeringBlogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              Engineering Blog →
            </a>
          )}
        </div>
      </aside>
    </>
  );
}

export function CompaniesPage() {
  const [selected, setSelected] = useState<Company | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: api.companies,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 px-6 py-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold text-ink">Company Explorer</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Deep dives into the companies shaping the industry
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-ink-muted py-8">
            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelected(company)}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 hover:border-accent/30 transition-all duration-150 text-left"
              >
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-9 h-9 rounded-xl object-contain bg-white p-1 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{company.name}</p>
                  <p className="text-xs text-ink-muted truncate">{company.tagline}</p>
                  <p className="text-xs text-ink-faint mt-0.5">Founded {company.founded}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <CompanyDetailPanel company={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

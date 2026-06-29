import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function AccordionItem({ question, index }: { question: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full flex items-start gap-3 p-3 rounded-lg bg-surface-1 border border-border hover:border-accent/30 transition-all text-left"
    >
      <span className="shrink-0 w-5 h-5 rounded-full bg-surface-2 text-ink-faint text-xs flex items-center justify-center mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink leading-snug">{question}</p>
        {open && (
          <p className="mt-2 text-xs text-ink-faint italic animate-fade-in">
            Think through this carefully — no shortcut answer is provided intentionally.
          </p>
        )}
      </div>
      <svg
        className={`shrink-0 w-4 h-4 text-ink-faint transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

const CATEGORY_COLOR: Record<string, string> = {
  "Distributed Systems": "text-orange-400",
  "Databases":           "text-amber-400",
  "Engineering":         "text-blue-400",
  "Security":            "text-red-400",
  "AI":                  "text-violet-400",
};

const RESOURCE_ICON: Record<string, string> = {
  article: "◈",
  video:   "▶",
  book:    "◉",
};

export function ConceptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: concept, isLoading, isError } = useQuery({
    queryKey: ["concept", id],
    queryFn: () => api.concept(id!),
    enabled: Boolean(id),
    staleTime: 60 * 60 * 1000,
  });

  const { data: allConcepts } = useQuery({
    queryKey: ["concepts"],
    queryFn: api.concepts,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !concept) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-ink-muted">
        <p className="text-sm">Concept not found.</p>
        <button onClick={() => navigate("/concepts")} className="text-xs text-accent hover:underline">
          ← Back to concepts
        </button>
      </div>
    );
  }

  const relatedConcepts = allConcepts?.filter((c) =>
    concept.relatedConcepts.includes(c.id)
  ) ?? [];

  const accentColor = CATEGORY_COLOR[concept.category] ?? "text-teal-400";

  return (
    <div className="flex-1 flex flex-col gap-7 px-6 py-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate("/concepts")}
        className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors w-fit"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        All concepts
      </button>

      {/* Hero */}
      <div className="flex flex-col gap-2">
        <p className={`text-xs font-medium uppercase tracking-widest ${accentColor}`}>
          {concept.category}
        </p>
        <h1 className="text-2xl font-semibold text-ink leading-tight">{concept.name}</h1>
      </div>

      {/* Simple explanation */}
      <div className="bg-accent-muted border border-accent/20 rounded-xl p-4">
        <p className="text-xs font-medium text-accent uppercase tracking-wide mb-2">Simple explanation</p>
        <p className="text-sm text-ink leading-relaxed">{concept.simpleExplanation}</p>
      </div>

      {/* Advanced explanation */}
      <Section title="How it actually works">
        <p className="text-sm text-ink-muted leading-relaxed">{concept.advancedExplanation}</p>
      </Section>

      {/* Real world usage */}
      <Section title="Where you'll see it in the wild">
        <ul className="flex flex-col gap-2">
          {concept.realWorldUsage.map((usage, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/60" />
              {usage}
            </li>
          ))}
        </ul>
      </Section>

      {/* Companies */}
      {concept.companiesUsing.length > 0 && (
        <Section title="Companies using this">
          <div className="flex flex-wrap gap-2">
            {concept.companiesUsing.map((company) => (
              <span
                key={company}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-1 border border-border text-ink-muted"
              >
                {company}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Interview questions */}
      {concept.interviewQuestions.length > 0 && (
        <Section title={`Interview questions (${concept.interviewQuestions.length})`}>
          <div className="flex flex-col gap-2">
            {concept.interviewQuestions.map((q, i) => (
              <AccordionItem key={i} question={q} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* Common mistakes */}
      {concept.commonMistakes.length > 0 && (
        <Section title="Common mistakes">
          <ul className="flex flex-col gap-2.5">
            {concept.commonMistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 text-red-400 text-sm mt-0.5">✗</span>
                <p className="text-sm text-ink-muted leading-relaxed">{m}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Related concepts */}
      {relatedConcepts.length > 0 && (
        <Section title="Related concepts">
          <div className="flex flex-col gap-2">
            {relatedConcepts.map((related) => (
              <button
                key={related.id}
                onClick={() => navigate(`/concepts/${related.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-1 border border-border hover:border-accent/30 hover:bg-surface-2 transition-all text-left group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    {related.name}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">{related.simpleExplanation}</p>
                </div>
                <svg className="w-4 h-4 text-ink-faint shrink-0 ml-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Resources */}
      {concept.resources.length > 0 && (
        <Section title="Learn more">
          <div className="flex flex-col gap-2">
            {concept.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-1 border border-border hover:border-accent/30 hover:bg-surface-2 transition-all group"
              >
                <span className="text-sm text-ink-faint">{RESOURCE_ICON[r.type] ?? "◈"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink group-hover:text-accent transition-colors leading-snug line-clamp-1">
                    {r.title}
                  </p>
                  <p className="text-xs text-ink-faint capitalize mt-0.5">{r.type}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-ink-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}

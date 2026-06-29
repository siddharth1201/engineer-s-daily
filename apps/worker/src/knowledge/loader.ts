import type { Company, CompanySnippet, Concept, ConceptSnippet, InterviewQuestion, Env } from "../types";
import companiesData from "../../../../data/companies.json";
import conceptsData from "../../../../data/concepts.json";
import questionsData from "../../../../data/questions.json";

// Data is bundled at build time — no KV seeding required.
// To update: edit data/*.json and redeploy.

export async function getCompanies(_env: Env): Promise<Company[]> {
  return companiesData as unknown as Company[];
}

export async function getConcepts(_env: Env): Promise<Concept[]> {
  return conceptsData as unknown as Concept[];
}

export async function getInterviewQuestions(_env: Env): Promise<InterviewQuestion[]> {
  return questionsData as unknown as InterviewQuestion[];
}

// Deterministic daily rotation: cycles through list based on day-of-year
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function pickForDay<T>(items: T[], date: Date): T | undefined {
  if (items.length === 0) return undefined;
  return items[dayOfYear(date) % items.length];
}

export function toCompanySnippet(company: Company): CompanySnippet {
  return {
    id: company.id,
    name: company.name,
    logo: company.logo,
    tagline: company.tagline,
    interestingFact: company.interestingFact,
  };
}

export function toConceptSnippet(concept: Concept): ConceptSnippet {
  return {
    id: concept.id,
    name: concept.name,
    simpleExplanation: concept.simpleExplanation,
    category: concept.category,
  };
}

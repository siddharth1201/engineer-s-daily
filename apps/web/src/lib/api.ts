import type { Article, Category, Company, Concept, DailyPick } from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  daily: (): Promise<DailyPick> => get("/daily"),
  feed: (category: Category): Promise<Article[]> =>
    get(`/feed?category=${encodeURIComponent(category)}`),
  company: (id: string): Promise<Company> => get(`/company/${id}`),
  companies: (): Promise<Company[]> => get("/companies"),
  concepts: (): Promise<Concept[]> => get("/concepts"),
  concept: (id: string): Promise<Concept> => get(`/concept/${id}`),
  search: (q: string): Promise<Article[]> =>
    get(`/search?q=${encodeURIComponent(q)}`),
};

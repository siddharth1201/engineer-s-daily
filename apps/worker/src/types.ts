export type Category =
  | "AI"
  | "Engineering"
  | "Cloud"
  | "Databases"
  | "Distributed Systems"
  | "Open Source"
  | "Startups"
  | "Security"
  | "Research"
  | "Videos";

export interface Article {
  id: string;
  title: string;
  author: string;
  source: string;
  domain: string;
  date: string;
  category: Category;
  summary: string;
  url: string;
  thumbnail?: string;
  readTime: number;
  tags: string[];
  qualityScore: number;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: Category;
  reputationScore: number;
  feedType: "rss" | "atom" | "json";
}

export interface CompanySnippet {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  interestingFact: string;
}

export interface Company extends CompanySnippet {
  founded: number;
  founders: string[];
  businessModel: string;
  techStack: string[];
  relatedConcepts: string[];
  relatedCompanies: string[];
  engineeringBlogUrl?: string;
  openSourceProjects: string[];
}

export interface ConceptSnippet {
  id: string;
  name: string;
  simpleExplanation: string;
  category: string;
}

export interface Concept extends ConceptSnippet {
  advancedExplanation: string;
  realWorldUsage: string[];
  interviewQuestions: string[];
  commonMistakes: string[];
  relatedConcepts: string[];
  companiesUsing: string[];
  resources: { title: string; url: string; type: "video" | "article" | "book" }[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: "leetcode" | "system-design" | "behavioral" | "distributed-systems" | "debugging";
  difficulty: "easy" | "medium" | "hard";
  hint: string;
}

export interface DailyPick {
  date: string;
  articles: Article[];
  company: CompanySnippet;
  concept: ConceptSnippet;
  interviewQuestion: InterviewQuestion;
}

export interface Env {
  KV: KVNamespace;
  ENVIRONMENT: string;
}

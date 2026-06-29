import { XMLParser } from "fast-xml-parser";
import type { Article, FeedSource } from "../types";
import { normalizeArticle } from "./normalize";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: false,
});

interface RawEntry {
  [key: string]: unknown;
  title?: string | { "#text"?: string };
  link?: string | { "@_href"?: string } | Array<{ "@_href"?: string; "@_rel"?: string }>;
  author?: string | { name?: string };
  published?: string;
  updated?: string;
  pubDate?: string;
  summary?: string;
  description?: string;
  content?: string | { "#text"?: string };
  "content:encoded"?: string;
  "media:thumbnail"?: { "@_url"?: string };
  enclosure?: { "@_url"?: string; "@_type"?: string };
  category?: string | string[];
  id?: string;
  guid?: string | { "#text"?: string };
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    return String((value as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
}

function extractLink(link: RawEntry["link"]): string {
  if (!link) return "";
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const alternate = link.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]);
    return alternate?.["@_href"] ?? link[0]?.["@_href"] ?? "";
  }
  if (typeof link === "object" && "@_href" in link) return link["@_href"] ?? "";
  return "";
}

function extractAuthor(author: RawEntry["author"]): string {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (typeof author === "object" && "name" in author) return author.name ?? "";
  return "";
}

function extractSummary(entry: RawEntry): string {
  const raw =
    entry["content:encoded"] ??
    extractText(entry.content) ??
    extractText(entry.summary) ??
    entry.description ??
    "";
  // Strip HTML tags, collapse whitespace, cap at 280 chars
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function extractThumbnail(entry: RawEntry): string | undefined {
  if (entry["media:thumbnail"]?.["@_url"]) return entry["media:thumbnail"]["@_url"];
  if (entry.enclosure?.["@_type"]?.startsWith("image/")) return entry.enclosure["@_url"];
  return undefined;
}

function extractDate(entry: RawEntry): string {
  const raw = entry.published ?? entry.updated ?? entry.pubDate ?? "";
  if (!raw) return new Date().toISOString();
  try {
    return new Date(raw).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function parseEntries(parsed: Record<string, unknown>): RawEntry[] {
  // RSS 2.0
  const rssChannel = (parsed["rss"] as Record<string, unknown> | undefined)?.["channel"] as
    | Record<string, unknown>
    | undefined;
  if (rssChannel) {
    const items = rssChannel["item"];
    if (Array.isArray(items)) return items as RawEntry[];
    if (items) return [items as RawEntry];
    return [];
  }

  // Atom
  const feed = parsed["feed"] as Record<string, unknown> | undefined;
  if (feed) {
    const entries = feed["entry"];
    if (Array.isArray(entries)) return entries as RawEntry[];
    if (entries) return [entries as RawEntry];
    return [];
  }

  return [];
}

export async function parseFeed(source: FeedSource): Promise<Article[]> {
  const response = await fetch(source.url, {
    headers: { "User-Agent": "EngineerDaily/1.0 (+https://engineerdaily.app)" },
    cf: { cacheEverything: true, cacheTtl: 3600 },
  });

  if (!response.ok) return [];

  const text = await response.text();

  // JSON Feed
  if (source.feedType === "json" || text.trimStart().startsWith("{")) {
    try {
      const data = JSON.parse(text) as { items?: RawEntry[] };
      return (data.items ?? []).map((item) => normalizeArticle(item, source));
    } catch {
      return [];
    }
  }

  // RSS / Atom
  try {
    const parsed = xmlParser.parse(text) as Record<string, unknown>;
    const entries = parseEntries(parsed);
    return entries.map((entry) => normalizeArticle(rawToEntry(entry), source));
  } catch {
    return [];
  }
}

function rawToEntry(entry: RawEntry): RawEntry & {
  _link: string;
  _author: string;
  _summary: string;
  _date: string;
  _thumbnail?: string;
} {
  return {
    ...entry,
    _link: extractLink(entry.link),
    _author: extractAuthor(entry.author),
    _summary: extractSummary(entry),
    _date: extractDate(entry),
    _thumbnail: extractThumbnail(entry),
  };
}

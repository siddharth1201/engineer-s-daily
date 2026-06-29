/**
 * Reads your current concept library, uses Claude to identify curriculum gaps,
 * then generates full concept entries for what to study next.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npm run next-concepts
 *
 * Optional progress tracking:
 *   Edit data/progress.json and add concept IDs you've actually studied:
 *   { "studied": ["consistent-hashing", "cap-theorem"] }
 *   Claude will use this to personalise recommendations.
 *
 * Output: data/pending-concepts.json — review and merge into data/concepts.json
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = new Anthropic();

// ── Zod schemas (for validation after we receive the JSON) ───────────────────

const RecommendationSchema = z.object({
  analysis: z.string(),
  nextConcepts: z
    .array(
      z.object({
        name: z.string(),
        category: z.enum([
          "Distributed Systems",
          "Databases",
          "Engineering",
          "Security",
          "AI",
        ]),
        rationale: z.string(),
      })
    )
    .min(3)
    .max(5),
});

const ConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    "Distributed Systems",
    "Databases",
    "Engineering",
    "Security",
    "AI",
  ]),
  simpleExplanation: z.string(),
  advancedExplanation: z.string(),
  realWorldUsage: z.array(z.string()).min(3).max(5),
  interviewQuestions: z.array(z.string()).min(3).max(5),
  commonMistakes: z.array(z.string()).min(2).max(4),
  relatedConcepts: z.array(z.string()),
  companiesUsing: z.array(z.string()).min(2).max(6),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        type: z.enum(["video", "article", "book"]),
      })
    )
    .min(2)
    .max(4),
});

type Concept = z.infer<typeof ConceptSchema>;

// ── Tool definitions (JSON schema — used to force structured output) ─────────

const RECOMMEND_TOOL: Anthropic.Tool = {
  name: "output_recommendations",
  description: "Output the curriculum gap analysis and next concepts to learn",
  input_schema: {
    type: "object" as const,
    properties: {
      analysis: {
        type: "string",
        description: "Brief gap analysis of the current curriculum",
      },
      nextConcepts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: {
              type: "string",
              enum: [
                "Distributed Systems",
                "Databases",
                "Engineering",
                "Security",
                "AI",
              ],
            },
            rationale: {
              type: "string",
              description:
                "Why this is the highest-leverage next concept to learn",
            },
          },
          required: ["name", "category", "rationale"],
        },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ["analysis", "nextConcepts"],
  },
};

const GENERATE_TOOL: Anthropic.Tool = {
  name: "output_concept",
  description: "Output a complete concept entry for the learning platform",
  input_schema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "kebab-case slug" },
      name: { type: "string" },
      category: {
        type: "string",
        enum: [
          "Distributed Systems",
          "Databases",
          "Engineering",
          "Security",
          "AI",
        ],
      },
      simpleExplanation: {
        type: "string",
        description: "1-2 sentences a mid-level engineer absorbs in 5 seconds",
      },
      advancedExplanation: {
        type: "string",
        description:
          "3-5 sentences covering mechanisms, tradeoffs, and nuances a staff engineer knows",
      },
      realWorldUsage: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
        description: "Specific examples naming real companies and how they use it",
      },
      interviewQuestions: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
        description: "Questions from senior/staff interviews at top companies",
      },
      commonMistakes: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 4,
        description: "Concrete misconceptions engineers actually hold",
      },
      relatedConcepts: {
        type: "array",
        items: { type: "string" },
        description: "Kebab-case IDs from the existing library only",
      },
      companiesUsing: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 6,
      },
      resources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            url: { type: "string", description: "Real URL — no hallucinated links" },
            type: { type: "string", enum: ["video", "article", "book"] },
          },
          required: ["title", "url", "type"],
        },
        minItems: 2,
        maxItems: 4,
      },
    },
    required: [
      "id",
      "name",
      "category",
      "simpleExplanation",
      "advancedExplanation",
      "realWorldUsage",
      "interviewQuestions",
      "commonMistakes",
      "relatedConcepts",
      "companiesUsing",
      "resources",
    ],
  },
};

// ── Helper: extract tool_use input from response ──────────────────────────────

function extractToolInput(
  response: Anthropic.Message,
  toolName: string
): unknown {
  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === toolName
  );
  if (!block) {
    throw new Error(
      `No "${toolName}" tool call in response. Stop reason: ${response.stop_reason}`
    );
  }
  return block.input;
}

// ── Step 1: Get curriculum recommendations ───────────────────────────────────

async function getRecommendations(
  existing: Concept[],
  studiedIds: string[]
): Promise<z.infer<typeof RecommendationSchema>> {
  const list = existing
    .map((c) => `- ${c.name} (${c.category}): ${c.simpleExplanation}`)
    .join("\n");

  const studiedNote =
    studiedIds.length > 0
      ? `\nThe learner has specifically worked through: ${studiedIds.join(", ")}.`
      : "";

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4000,
    thinking: { type: "enabled", budget_tokens: 2000 },
    tools: [RECOMMEND_TOOL],
    tool_choice: { type: "tool", name: "output_recommendations" },
    messages: [
      {
        role: "user",
        content: `You are a curriculum designer for a software engineering learning platform targeting senior engineers at top-tier tech companies.

Current knowledge base (${existing.length} concepts):
${list}
${studiedNote}

Identify the 4-5 most impactful concepts missing from this curriculum. Prioritise:
1. Critical gaps that block understanding of many other topics (high leverage)
2. Concepts that appear in FAANG staff-level system design interviews
3. Natural progressions — concepts that build directly on what's already here
4. Balance across: Distributed Systems, Databases, Engineering, Security, AI

Call output_recommendations with your findings.`,
      },
    ],
  });

  const raw = extractToolInput(response, "output_recommendations");
  return RecommendationSchema.parse(raw);
}

// ── Step 2: Generate a single concept ────────────────────────────────────────

async function generateConcept(
  name: string,
  category: string,
  knownIds: string[]
): Promise<Concept> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "enabled", budget_tokens: 3000 },
    tools: [GENERATE_TOOL],
    tool_choice: { type: "tool", name: "output_concept" },
    messages: [
      {
        role: "user",
        content: `Generate a comprehensive, expert-level concept entry for "${name}" (${category}) for a software engineering learning platform targeting senior engineers.

Requirements:
- simpleExplanation: 1-2 clear sentences, zero jargon, something a bootcamp grad understands
- advancedExplanation: 3-5 sentences on internal mechanisms, key tradeoffs, and what a staff engineer knows that juniors miss
- realWorldUsage: 3-5 bullet points naming specific companies (e.g. "Stripe uses X to Y"). Be concrete, not generic.
- interviewQuestions: 3-5 questions asked in senior/staff system design interviews. Make them substantive.
- commonMistakes: 2-4 concrete misconceptions engineers actually hold — not vague platitudes
- relatedConcepts: pick 2-4 IDs from this list ONLY: [${knownIds.join(", ")}]
- companiesUsing: 3-6 real tech companies that notably rely on this
- resources: 2-4 real resources that exist (specific papers, YouTube talks, book chapters). URLs must be real and resolvable.

The id must be a kebab-case slug derived from the name.

Call output_concept with the full entry.`,
      },
    ],
  });

  const raw = extractToolInput(response, "output_concept");
  return ConceptSchema.parse(raw);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const conceptsPath = path.join(ROOT, "data", "concepts.json");
  const progressPath = path.join(ROOT, "data", "progress.json");
  const outputPath = path.join(ROOT, "data", "pending-concepts.json");

  const existing: Concept[] = JSON.parse(readFileSync(conceptsPath, "utf-8"));

  const studiedIds: string[] = existsSync(progressPath)
    ? (JSON.parse(readFileSync(progressPath, "utf-8")).studied ?? [])
    : [];

  console.log(`\nKnowledge base: ${existing.length} concepts`);
  if (studiedIds.length > 0) {
    console.log(`Studied: ${studiedIds.join(", ")}`);
  }
  console.log("\nStep 1 — Analysing curriculum gaps...\n");

  const { analysis, nextConcepts } = await getRecommendations(
    existing,
    studiedIds
  );

  console.log("Analysis:", analysis);
  console.log("\nRecommended next concepts:");
  nextConcepts.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} (${c.category})`);
    console.log(`     ${c.rationale}`);
  });

  console.log("\nStep 2 — Generating concept entries...\n");

  const knownIds = existing.map((c) => c.id);
  const generated: Concept[] = [];

  for (const rec of nextConcepts) {
    process.stdout.write(`  ${rec.name}... `);
    try {
      const concept = await generateConcept(rec.name, rec.category, knownIds);
      generated.push(concept);
      knownIds.push(concept.id);
      console.log(`done (${concept.id})`);
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message}`);
    }
  }

  writeFileSync(outputPath, JSON.stringify(generated, null, 2));

  console.log(
    `\n✓ ${generated.length} concepts written to data/pending-concepts.json`
  );
  console.log(
    "  Review the file, then append entries to data/concepts.json when satisfied.\n"
  );
}

main().catch((err) => {
  console.error("\nFatal:", (err as Error).message ?? err);
  process.exit(1);
});

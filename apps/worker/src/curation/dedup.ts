// Jaccard similarity on normalized title trigrams
function trigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const result = new Set<string>();
  for (let i = 0; i <= normalized.length - 3; i++) {
    result.add(normalized.slice(i, i + 3));
  }
  return result;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

export function isDuplicate(title: string, seenTitles: string[]): boolean {
  const candidateTrigrams = trigrams(title);
  return seenTitles.some((seen) => {
    const seenTrigrams = trigrams(seen);
    return jaccardSimilarity(candidateTrigrams, seenTrigrams) >= 0.6;
  });
}

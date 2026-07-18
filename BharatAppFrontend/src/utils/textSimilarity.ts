/**
 * Small, dependency-free string similarity helpers used to match OCR'd
 * prescription text against the real medicine catalogue (see
 * services/prescriptionOcr.ts). No fuzzy-matching library is installed, and
 * the catalogue is small enough (dozens–low hundreds of medicines) that a
 * plain O(n*m) Levenshtein pass per comparison is more than fast enough.
 */

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Classic Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row.push(Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost));
    }
    prev = row;
  }
  return prev[b.length];
}

/** 1 (identical) .. 0 (nothing in common), based on edit distance. */
function charSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Jaccard overlap of the two strings' word sets. */
function wordOverlap(a: string, b: string): number {
  const wa = new Set(a.split(' ').filter(Boolean));
  const wb = new Set(b.split(' ').filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / new Set([...wa, ...wb]).size;
}

/**
 * Similarity score in [0, 1] between two free-text strings (e.g. an OCR line
 * and a catalogue medicine name). Blends whole-string edit distance with
 * word-set overlap so both "Vitamln D3" ≈ "Vitamin D3" (typo) and "Tab Dolo
 * 650mg" ≈ "Dolo 650" (extra words) score well.
 */
export function textSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;
  return Math.max(charSimilarity(na, nb), wordOverlap(na, nb) * 0.95);
}

export interface BestMatch<T> {
  item: T;
  score: number;
}

/** The best-scoring item in `candidates` for `query`, by `getLabel(item)`. */
export function bestMatch<T>(
  query: string,
  candidates: T[],
  getLabel: (item: T) => string,
): BestMatch<T> | null {
  let best: BestMatch<T> | null = null;
  for (const item of candidates) {
    const score = textSimilarity(query, getLabel(item));
    if (!best || score > best.score) best = {item, score};
  }
  return best;
}

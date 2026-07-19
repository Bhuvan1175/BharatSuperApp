/** Structured context handed to the LLM — already-computed numbers only; the
 * summary never influences the numeric scores, only describes them. */
export interface AreaInsightContext {
  areaName: string;
  cityName: string;
  overallScore: number | null;
  categoryScores: Record<string, number | null>;
  topStats: Record<string, number>;
  nearbyHighlights: string[];
}

export interface AreaInsightResult {
  summary: string;
  pros: string[];
  cons: string[];
  recommendations: string[];
}

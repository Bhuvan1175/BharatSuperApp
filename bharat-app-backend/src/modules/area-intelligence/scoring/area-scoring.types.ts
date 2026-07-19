import { AreaScoreCategory } from '@prisma/client';

/**
 * One raw signal already mapped to the 0-10 scale by a category scorer
 * (never mixed units past this point). `value: null` means the signal
 * couldn't be computed (missing raw data) — its weight is redistributed
 * across the remaining available inputs in the same category, never
 * defaulted to a neutral score.
 */
export interface NormalizedInput {
  /** Stable key for auditability, e.g. "crimeRateNormalized". Stored verbatim
   * in `AreaCategoryScore.inputsUsed`. */
  key: string;
  value: number | null;
  /** Base weight within this category, before redistribution. Must sum to 1
   * across a category's full input set (including unavailable ones). */
  weight: number;
}

export interface CategoryScoreInput {
  category: AreaScoreCategory;
  /** This category's weight in the overall-score rollup. */
  categoryWeight: number;
  inputs: NormalizedInput[];
  /** SourceConfidence.confidenceScore rows (0-100) feeding this category. */
  sourceConfidences: number[];
  /** Age of the newest contributing raw data, in hours. null = unknown. */
  dataAgeHours: number | null;
}

export interface CategoryScoreResult {
  category: AreaScoreCategory;
  /** null = zero inputs available for this category ("insufficient data"). */
  score: number | null;
  confidence: number;
  /** The categoryWeight actually applied in the overall rollup (0 when score is null). */
  weightUsed: number;
  inputsUsed: Record<string, number | null>;
}

export interface OverallScoreResult {
  overallScore: number | null;
  confidence: number;
  categories: CategoryScoreResult[];
}

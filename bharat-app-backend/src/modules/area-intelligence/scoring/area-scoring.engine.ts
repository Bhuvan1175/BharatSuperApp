import {
  CategoryScoreInput,
  CategoryScoreResult,
  NormalizedInput,
  OverallScoreResult,
} from './area-scoring.types';

/**
 * Pure scoring math — no Prisma, no fetch, no I/O of any kind. Everything
 * here is a deterministic function of its inputs, so it's unit-testable
 * without a database. `AreaScoringService` is the I/O wrapper that loads raw
 * data, calls this, and persists the result.
 *
 * Design (see docs/area-intelligence-architecture.md §5):
 *   - Every raw input is normalized to 0-10 by a category scorer BEFORE it
 *     reaches this engine.
 *   - Missing-input handling: an unavailable input's weight is redistributed
 *     proportionally across the remaining available inputs in its category
 *     (weights renormalized to sum to 1) — never defaulted to a neutral value.
 *   - If zero inputs are available for a category, its score is `null` and
 *     confidence is `0`.
 *   - Overall score: weighted mean of category scores, using only categories
 *     with a non-null score (same redistribution rule).
 */
export class AreaScoringEngine {
  /** Clamp a raw value into [0, 10] against a reference [min, max] range. */
  static normalize(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    const clamped = Math.min(Math.max(value, min), max);
    return ((clamped - min) / (max - min)) * 10;
  }

  /** Same as {@link normalize} but inverted (higher raw value → lower score). */
  static normalizeInverse(value: number, min: number, max: number): number {
    return 10 - AreaScoringEngine.normalize(value, min, max);
  }

  /**
   * Weighted mean of the available inputs, with unavailable inputs' weight
   * redistributed proportionally across the rest. Returns null if none of the
   * inputs are available.
   */
  private static weightedMean(
    items: { value: number | null; weight: number }[],
  ): number | null {
    const available = items.filter(
      (i): i is { value: number; weight: number } => i.value !== null,
    );
    const totalAvailableWeight = available.reduce((s, i) => s + i.weight, 0);
    if (available.length === 0 || totalAvailableWeight <= 0) return null;

    const sum = available.reduce(
      (s, i) => s + i.value * (i.weight / totalAvailableWeight),
      0,
    );
    return sum;
  }

  /**
   * Confidence for one category: a function of (a) the fraction of inputs
   * that were actually available, (b) the mean of any SourceConfidence rows
   * for that area/category, and (c) data recency (older data caps confidence
   * downward). Output 0-100.
   */
  static computeCategoryConfidence(input: CategoryScoreInput): number {
    if (input.inputs.length === 0) return 0;

    const availableCount = input.inputs.filter((i) => i.value !== null).length;
    const availabilityRatio = availableCount / input.inputs.length;
    if (availabilityRatio === 0) return 0;

    const sourceConfidenceAvg = input.sourceConfidences.length
      ? input.sourceConfidences.reduce((a, b) => a + b, 0) /
        input.sourceConfidences.length
      : 60; // no SourceConfidence rows yet → a neutral-ish default, not a guess at data quality

    // Recency factor: full weight under 7 days old, decaying to a 0.5 floor
    // by 180 days, unknown age treated as 30 days (mildly discounted).
    const ageHours = input.dataAgeHours ?? 24 * 30;
    const ageDays = ageHours / 24;
    const recencyFactor =
      ageDays <= 7 ? 1 : Math.max(0.5, 1 - (ageDays - 7) / (180 - 7));

    const raw =
      availabilityRatio * 0.5 * 100 +
      sourceConfidenceAvg * 0.3 +
      recencyFactor * 100 * 0.2;

    return Math.round(Math.min(100, Math.max(0, raw)));
  }

  /** Compute one category's score + confidence from its normalized inputs. */
  static computeCategoryScore(input: CategoryScoreInput): CategoryScoreResult {
    const score = AreaScoringEngine.weightedMean(input.inputs);
    const confidence =
      score === null ? 0 : AreaScoringEngine.computeCategoryConfidence(input);

    const inputsUsed: Record<string, number | null> = {};
    for (const i of input.inputs) inputsUsed[i.key] = i.value;

    return {
      category: input.category,
      score: score === null ? null : Math.round(score * 100) / 100,
      confidence,
      weightUsed: score === null ? 0 : input.categoryWeight,
      inputsUsed,
    };
  }

  /**
   * Overall score: weighted mean of category scores (categories with a null
   * score are excluded and their weight redistributed), plus an overall
   * confidence (weighted mean of category confidences, using the same
   * category weights).
   */
  static computeOverallScore(
    categoryInputs: CategoryScoreInput[],
  ): OverallScoreResult {
    const categories = categoryInputs.map((c) =>
      AreaScoringEngine.computeCategoryScore(c),
    );

    const scoreItems: NormalizedInput[] = categories.map((c, idx) => ({
      key: c.category,
      value: c.score,
      weight: categoryInputs[idx].categoryWeight,
    }));
    const overallScore = AreaScoringEngine.weightedMean(scoreItems);

    const confidenceItems: NormalizedInput[] = categories.map((c, idx) => ({
      key: c.category,
      value: c.score === null ? null : c.confidence,
      weight: categoryInputs[idx].categoryWeight,
    }));
    const overallConfidence = AreaScoringEngine.weightedMean(confidenceItems);

    return {
      overallScore:
        overallScore === null ? null : Math.round(overallScore * 100) / 100,
      confidence:
        overallConfidence === null ? 0 : Math.round(overallConfidence),
      categories,
    };
  }
}

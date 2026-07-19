import { NormalizedInput } from '../area-scoring.types';
import { AreaScoringEngine } from '../area-scoring.engine';

export interface UtilitiesRawInputs {
  /** Average piped water supply hours per day. */
  waterSupplyHoursPerDay?: number;
  /** Power outages in the last 30 days. */
  powerOutagesPerMonth?: number;
}

export function computeUtilitiesInputs(
  raw: UtilitiesRawInputs,
): NormalizedInput[] {
  return [
    {
      key: 'waterSupplyNormalized',
      weight: 0.5,
      value:
        raw.waterSupplyHoursPerDay === undefined
          ? null
          : AreaScoringEngine.normalize(raw.waterSupplyHoursPerDay, 1, 24),
    },
    {
      key: 'powerOutagesInverse',
      weight: 0.5,
      value:
        raw.powerOutagesPerMonth === undefined
          ? null
          : AreaScoringEngine.normalizeInverse(raw.powerOutagesPerMonth, 0, 30),
    },
  ];
}

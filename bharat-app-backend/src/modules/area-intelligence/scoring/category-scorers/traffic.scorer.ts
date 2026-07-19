import { NormalizedInput } from '../area-scoring.types';
import { AreaScoringEngine } from '../area-scoring.engine';

export interface TrafficRawInputs {
  /** Average one-way commute to the nearest city center, in minutes. */
  avgCommuteMinutes?: number;
  /** 0-100 congestion index (higher = worse), from a traffic provider. */
  congestionIndex?: number;
}

export function computeTrafficInputs(raw: TrafficRawInputs): NormalizedInput[] {
  return [
    {
      key: 'commuteTimeInverse',
      weight: 0.5,
      value:
        raw.avgCommuteMinutes === undefined
          ? null
          : AreaScoringEngine.normalizeInverse(raw.avgCommuteMinutes, 5, 90),
    },
    {
      key: 'congestionInverse',
      weight: 0.5,
      value:
        raw.congestionIndex === undefined
          ? null
          : AreaScoringEngine.normalizeInverse(raw.congestionIndex, 0, 100),
    },
  ];
}

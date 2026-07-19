import { NormalizedInput } from '../area-scoring.types';
import { AreaScoringEngine } from '../area-scoring.engine';

/** Raw Safety inputs, each optional — undefined means "not collected yet". */
export interface SafetyRawInputs {
  /** Reported crimes per 1,000 residents per year (NCRB / govt crime data). */
  crimeRatePer1000?: number;
  /** Police stations within a 3km radius. */
  policeStationsWithin3Km?: number;
  /** Citizen-reported incidents in the last 30 days (app-internal, if tracked). */
  incidentReportsPerMonth?: number;
}

/**
 * `crimeRateNormalized * 0.4 + policeStationDensity * 0.3 + incidentReportsInverse * 0.3`
 * (docs/area-intelligence-architecture.md §5, Safety example).
 */
export function computeSafetyInputs(raw: SafetyRawInputs): NormalizedInput[] {
  return [
    {
      key: 'crimeRateNormalized',
      weight: 0.4,
      value:
        raw.crimeRatePer1000 === undefined
          ? null
          : AreaScoringEngine.normalizeInverse(raw.crimeRatePer1000, 0, 50),
    },
    {
      key: 'policeStationDensity',
      weight: 0.3,
      value:
        raw.policeStationsWithin3Km === undefined
          ? null
          : AreaScoringEngine.normalize(raw.policeStationsWithin3Km, 0, 5),
    },
    {
      key: 'incidentReportsInverse',
      weight: 0.3,
      value:
        raw.incidentReportsPerMonth === undefined
          ? null
          : AreaScoringEngine.normalizeInverse(
              raw.incidentReportsPerMonth,
              0,
              20,
            ),
    },
  ];
}

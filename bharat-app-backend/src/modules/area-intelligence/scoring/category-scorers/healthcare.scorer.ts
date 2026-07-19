import { NormalizedInput } from '../area-scoring.types';
import { AreaScoringEngine } from '../area-scoring.engine';

export interface HealthcareRawInputs {
  /** Hospitals/clinics within a 5km radius (NearbyAmenity HOSPITAL count). */
  hospitalsWithin5Km?: number;
  /** Hospital beds per 1,000 residents, where govt facility datasets have it. */
  bedsPerThousand?: number;
}

export function computeHealthcareInputs(
  raw: HealthcareRawInputs,
): NormalizedInput[] {
  return [
    {
      key: 'hospitalDensity',
      weight: 0.6,
      value:
        raw.hospitalsWithin5Km === undefined
          ? null
          : AreaScoringEngine.normalize(raw.hospitalsWithin5Km, 0, 10),
    },
    {
      key: 'bedsPerThousandNormalized',
      weight: 0.4,
      value:
        raw.bedsPerThousand === undefined
          ? null
          : AreaScoringEngine.normalize(raw.bedsPerThousand, 0, 5),
    },
  ];
}

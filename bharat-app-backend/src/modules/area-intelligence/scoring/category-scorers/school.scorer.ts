import { NormalizedInput } from '../area-scoring.types';
import { AreaScoringEngine } from '../area-scoring.engine';

export interface SchoolRawInputs {
  /** Schools within a 3km radius (NearbyAmenity SCHOOL count). */
  schoolsWithin3Km?: number;
  /** Pupil-teacher ratio (lower is better), from UDISE+ where available. */
  pupilTeacherRatio?: number;
}

export function computeSchoolInputs(raw: SchoolRawInputs): NormalizedInput[] {
  return [
    {
      key: 'schoolDensity',
      weight: 0.5,
      value:
        raw.schoolsWithin3Km === undefined
          ? null
          : AreaScoringEngine.normalize(raw.schoolsWithin3Km, 0, 8),
    },
    {
      key: 'pupilTeacherRatioInverse',
      weight: 0.5,
      value:
        raw.pupilTeacherRatio === undefined
          ? null
          : AreaScoringEngine.normalizeInverse(raw.pupilTeacherRatio, 15, 60),
    },
  ];
}

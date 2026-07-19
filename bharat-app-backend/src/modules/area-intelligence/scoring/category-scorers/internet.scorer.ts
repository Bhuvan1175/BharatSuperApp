import { NormalizedInput } from '../area-scoring.types';
import { AreaScoringEngine } from '../area-scoring.engine';

export interface InternetRawInputs {
  /** Average fixed-broadband download speed, Mbps (TRAI open data). */
  avgDownloadMbps?: number;
  /** % of households with a broadband connection. */
  broadbandPenetrationPct?: number;
}

export function computeInternetInputs(
  raw: InternetRawInputs,
): NormalizedInput[] {
  return [
    {
      key: 'downloadSpeedNormalized',
      weight: 0.6,
      value:
        raw.avgDownloadMbps === undefined
          ? null
          : AreaScoringEngine.normalize(raw.avgDownloadMbps, 2, 100),
    },
    {
      key: 'broadbandPenetrationNormalized',
      weight: 0.4,
      value:
        raw.broadbandPenetrationPct === undefined
          ? null
          : AreaScoringEngine.normalize(raw.broadbandPenetrationPct, 0, 80),
    },
  ];
}

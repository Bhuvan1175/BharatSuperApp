import {CrowdLevel, EligibilityStatus} from '../types';
import {palette} from '../theme/colors';

let counter = 0;
/** Simple unique id generator for client-side items. */
export const uid = (prefix = 'id'): string => {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
};

export const crowdColor = (level: CrowdLevel): string => {
  switch (level) {
    case 'low':
      return palette.emerald;
    case 'medium':
      return palette.amber;
    case 'high':
      return palette.alertRed;
  }
};

export const crowdLabelKey = (
  level: CrowdLevel,
): 'crowdLow' | 'crowdMedium' | 'crowdHigh' => {
  switch (level) {
    case 'low':
      return 'crowdLow';
    case 'medium':
      return 'crowdMedium';
    case 'high':
      return 'crowdHigh';
  }
};

/** Colour for an area / category score on the 0-10 scale. */
export const scoreColor = (score: number): string => {
  if (score >= 8) {
    return palette.emerald;
  }
  if (score >= 6) {
    return palette.saffron;
  }
  if (score >= 4) {
    return palette.amber;
  }
  return palette.alertRed;
};

export const scoreLabel = (score: number): string => {
  if (score >= 8.5) {
    return 'Excellent';
  }
  if (score >= 7) {
    return 'Very good';
  }
  if (score >= 5.5) {
    return 'Good';
  }
  if (score >= 4) {
    return 'Average';
  }
  return 'Below average';
};

export const eligibilityColor = (status: EligibilityStatus): string => {
  switch (status) {
    case 'eligible':
      return palette.emerald;
    case 'maybe':
      return palette.amber;
    case 'ineligible':
      return palette.grey500;
  }
};

export const wait = (ms: number): Promise<void> =>
  new Promise(res => setTimeout(res, ms));

/** "AREA_MASTER_SYNC" -> "Area Master Sync" — background job type labels. */
export const formatJobType = (jobType: string): string =>
  jobType
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** % change between the last two monthly price-history points, or null if too few. */
export const computePriceGrowthPct = (
  history: {avgPrice: number}[],
): number | null => {
  if (history.length < 2) {
    return null;
  }
  const prev = history[history.length - 2].avgPrice;
  const latest = history[history.length - 1].avgPrice;
  if (!prev) {
    return null;
  }
  return ((latest - prev) / prev) * 100;
};

/** Average of the non-null builder ratings for an area, or null if none. */
export const averageBuilderRating = (
  ratings: {rating: number | null}[],
): number | null => {
  const valid = ratings
    .map(r => r.rating)
    .filter((r): r is number => r != null);
  if (!valid.length) {
    return null;
  }
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

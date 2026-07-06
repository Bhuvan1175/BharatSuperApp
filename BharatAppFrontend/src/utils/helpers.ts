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

export const crowdLabelKey = (level: CrowdLevel): 'crowdLow' | 'crowdMedium' | 'crowdHigh' => {
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
  if (score >= 8) return palette.emerald;
  if (score >= 6) return palette.saffron;
  if (score >= 4) return palette.amber;
  return palette.alertRed;
};

export const scoreLabel = (score: number): string => {
  if (score >= 8.5) return 'Excellent';
  if (score >= 7) return 'Very good';
  if (score >= 5.5) return 'Good';
  if (score >= 4) return 'Average';
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

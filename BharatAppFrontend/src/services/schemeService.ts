import {apiRequest} from './apiClient';
import {SCHEMES, schemesByCategory} from '../data/schemes';
import {Scheme, EligibilityProfile, SchemeCategory} from '../types';

export const schemeService = {
  byCategory: (category: SchemeCategory): Promise<Scheme[]> =>
    apiRequest('/schemes/category', () => schemesByCategory(category)),
  /** POST /schemes/eligibility */
  checkEligibility: (profile: EligibilityProfile): Promise<Scheme[]> =>
    apiRequest(
      '/schemes/eligibility',
      () => {
        const age = parseInt(profile.age, 10) || 0;
        return SCHEMES.map(s => {
          let status = s.eligibilityStatus;
          if (s.category === 'Senior Citizen') status = age >= 60 ? 'eligible' : 'ineligible';
          if (s.category === 'Scholarships') status = age <= 30 ? 'eligible' : 'maybe';
          if (s.category === 'Women') status = profile.gender === 'Female' ? 'eligible' : 'ineligible';
          return {...s, eligibilityStatus: status};
        }).sort((a, b) => rank(a.eligibilityStatus) - rank(b.eligibilityStatus));
      },
      {method: 'POST', latencyMs: 1200},
    ),
  all: (): Promise<Scheme[]> => apiRequest('/schemes', () => SCHEMES),
};

const rank = (s: string): number => (s === 'eligible' ? 0 : s === 'maybe' ? 1 : 2);

/**
 * Spacing, radii, and sizing scale. All layout values reference these tokens so
 * spacing stays consistent and responsive across screen sizes.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
  circle: 9999,
} as const;

export const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};

/** Minimum accessible touch target (WCAG AA / spec: >= 44px). */
export const MIN_TOUCH = 44;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

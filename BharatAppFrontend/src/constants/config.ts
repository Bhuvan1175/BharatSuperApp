/** App-wide configuration & storage keys. */
export const APP_CONFIG = {
  name: 'Bharat Super App',
  otpLength: 6,
  otpResendSeconds: 30,
  maxRecentSearches: 5,
  maxOtpAttempts: 3,
  typingIndicatorDelayMs: 800, // < 1.2s per NFR
  aiResponseDelayMs: 1400,
  sosCountdownSeconds: 3,
  supportPhone: '112',
} as const;

export const STORAGE_KEYS = {
  onboardingDone: '@bsa/onboarding_done',
  language: '@bsa/language',
  theme: '@bsa/theme',
  session: '@bsa/session',
  recents: '@bsa/recent_searches',
  savedItems: '@bsa/saved_items',
  aiPersonality: '@bsa/ai_personality',
  notifications: '@bsa/notifications',
} as const;

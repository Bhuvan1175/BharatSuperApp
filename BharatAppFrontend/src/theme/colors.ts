/**
 * Brand palette — single source of truth for colour.
 * Values taken directly from the design system in the Product & Technical
 * Documentation (§3 Design system).
 */
export const palette = {
  saffron: '#FF7A00', // Deep Saffron — primary
  saffronDark: '#E56D00',
  saffronSoft: '#FFF1E5',
  royalBlue: '#0057FF', // Royal Blue — secondary
  royalBlueSoft: '#E6EEFF',
  emerald: '#22C55E', // Emerald — success / positive
  emeraldSoft: '#E7F9EF',
  alertRed: '#FF3B30', // Alert Red — emergency / SOS / high-crowd
  alertRedSoft: '#FFEAE8',
  amber: '#F59E0B', // medium crowd
  amberSoft: '#FEF3E2',
  ink: '#121212', // text / dark surfaces
  darkBg: '#0C0C0F', // near-black dark-mode background
  darkSurface: '#16161B',
  darkCard: '#1D1D24',
  offWhite: '#FAFAF8', // light background
  white: '#FFFFFF',
  grey900: '#1A1A1A',
  grey700: '#3A3A3A',
  grey500: '#6B6B6B',
  grey400: '#9A9A9A',
  grey300: '#CFCFCF',
  grey200: '#E6E6E4',
  grey100: '#F1F1EF',
  transparent: 'transparent',
} as const;

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  background: string;
  surface: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  overlay: string;
  chatUserBubble: string;
  chatAiBubble: string;
  navActive: string;
  navInactive: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  primary: palette.saffron,
  primaryDark: palette.saffronDark,
  primarySoft: palette.saffronSoft,
  secondary: palette.royalBlue,
  secondarySoft: palette.royalBlueSoft,
  accent: palette.emerald,
  accentSoft: palette.emeraldSoft,
  danger: palette.alertRed,
  dangerSoft: palette.alertRedSoft,
  warning: palette.amber,
  warningSoft: palette.amberSoft,
  background: palette.offWhite,
  surface: palette.white,
  card: palette.white,
  cardAlt: palette.grey100,
  border: palette.grey200,
  text: palette.ink,
  textSecondary: palette.grey700,
  textMuted: palette.grey500,
  textInverse: palette.white,
  overlay: 'rgba(18,18,18,0.45)',
  chatUserBubble: palette.royalBlue,
  chatAiBubble: palette.white,
  navActive: palette.saffron,
  navInactive: palette.grey400,
  shadow: 'rgba(18,18,18,0.12)',
};

export const darkColors: ThemeColors = {
  primary: palette.saffron,
  primaryDark: palette.saffronDark,
  primarySoft: 'rgba(255,122,0,0.14)',
  secondary: '#4C86FF',
  secondarySoft: 'rgba(0,87,255,0.18)',
  accent: palette.emerald,
  accentSoft: 'rgba(34,197,94,0.16)',
  danger: '#FF5247',
  dangerSoft: 'rgba(255,59,48,0.18)',
  warning: palette.amber,
  warningSoft: 'rgba(245,158,11,0.16)',
  background: palette.darkBg,
  surface: palette.darkSurface,
  card: palette.darkCard,
  cardAlt: '#24242C',
  border: '#2C2C35',
  text: '#F5F5F7',
  textSecondary: '#C2C2CC',
  textMuted: '#8A8A96',
  textInverse: palette.ink,
  overlay: 'rgba(0,0,0,0.6)',
  chatUserBubble: '#0057FF',
  chatAiBubble: palette.darkCard,
  navActive: palette.saffron,
  navInactive: '#6C6C78',
  shadow: 'rgba(0,0,0,0.5)',
};

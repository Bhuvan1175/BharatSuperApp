import {lightColors, darkColors, palette, ThemeColors} from './colors';
import {spacing, radius, shadows, hitSlop, MIN_TOUCH} from './spacing';
import {typography, fontFamily} from './typography';

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamily,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamily,
};

export {palette, spacing, radius, shadows, typography, fontFamily, hitSlop, MIN_TOUCH};
export type {ThemeColors};

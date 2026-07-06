import {Platform, TextStyle} from 'react-native';

/**
 * Typography — Poppins across the product (rounded, friendly), Roboto Mono only
 * for data/code annotations. If the Poppins/Roboto Mono ttf files are not yet
 * linked in native assets, these families fall back to the platform default.
 */
const poppins = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

// Fallback so the app never crashes before fonts are linked.
const systemFallback = Platform.select({ios: 'System', android: 'sans-serif'});

export const fontFamily = {
  regular: poppins.regular,
  medium: poppins.medium,
  semiBold: poppins.semiBold,
  bold: poppins.bold,
  mono: Platform.select({ios: 'Menlo', android: 'monospace'}) as string,
  fallback: systemFallback as string,
};

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'mono';

/**
 * Minimum interactive type per spec: 11px caption / 14.5px body.
 */
export const typography: Record<Variant, TextStyle> = {
  display: {fontFamily: poppins.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.5},
  h1: {fontFamily: poppins.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3},
  h2: {fontFamily: poppins.semiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2},
  h3: {fontFamily: poppins.semiBold, fontSize: 18, lineHeight: 24},
  title: {fontFamily: poppins.medium, fontSize: 16, lineHeight: 22},
  body: {fontFamily: poppins.regular, fontSize: 14.5, lineHeight: 21},
  bodyStrong: {fontFamily: poppins.medium, fontSize: 14.5, lineHeight: 21},
  label: {fontFamily: poppins.medium, fontSize: 13, lineHeight: 18},
  caption: {fontFamily: poppins.regular, fontSize: 11, lineHeight: 15},
  mono: {fontFamily: Platform.select({ios: 'Menlo', android: 'monospace'}), fontSize: 13, lineHeight: 18},
};

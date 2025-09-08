import { spacing } from '../base/spacing';
import { typography } from '../base/typography';
import { layout, borderRadius } from '../base/layout';
import { darkColors, type DarkColors } from './colors';
import { darkLayout, type DarkLayout } from './layout';

export const darkTheme = {
  spacing,
  typography,
  layout: { ...layout, ...darkLayout },
  borderRadius,
  colors: darkColors,
} as const;

export type DarkTheme = typeof darkTheme;
export type { DarkColors, DarkLayout };

import { spacing } from '../base/spacing';
import { typography } from '../base/typography';
import { layout, borderRadius } from '../base/layout';
import { lightColors, type LightColors } from './colors';
import { lightLayout, type LightLayout } from './layout';

export const lightTheme = {
  spacing,
  typography,
  layout: { ...layout, ...lightLayout },
  borderRadius,
  colors: lightColors,
} as const;

export type LightTheme = typeof lightTheme;
export type { LightColors, LightLayout };

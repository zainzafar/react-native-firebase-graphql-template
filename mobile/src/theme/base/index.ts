import { spacing, type Spacing } from './spacing';
import { typography, type Typography } from './typography';
import { layout, borderRadius, type Layout, type BorderRadius } from './layout';
import { baseColors, type BaseColors } from './colors';

// Re-export for external use
export { spacing, type Spacing } from './spacing';
export { typography, type Typography } from './typography';
export { layout, borderRadius, type Layout, type BorderRadius } from './layout';
export { baseColors, type BaseColors, type AppColors } from './colors';

// Base theme composition
export const baseTheme = {
  spacing,
  typography,
  layout,
  borderRadius,
  colors: baseColors,
} as const;

export type BaseTheme = typeof baseTheme;

import { spacing } from './spacing';
import { typography } from './typography';
import { layout, borderRadius } from './layout';
import { baseColors } from './colors';

// Re-export for external use
export { spacing } from './spacing';
export { typography } from './typography';
export { layout, borderRadius } from './layout';
export { baseColors } from './colors';

// Re-export types
export type { Spacing } from './spacing';
export type { Typography } from './typography';
export type { Layout, BorderRadius } from './layout';
export type { BaseColors, AppColors } from './colors';

// Base theme composition
export const baseTheme = {
  spacing,
  typography,
  layout,
  borderRadius,
  colors: baseColors,
} as const;

export type BaseTheme = typeof baseTheme;

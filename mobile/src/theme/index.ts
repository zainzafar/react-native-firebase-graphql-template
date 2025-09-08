// Main theme exports
export { ThemeProvider, useTheme } from './ThemeProvider';
export { type ThemeName } from './themes';

// Theme type exports
export type { LightTheme, LightColors, LightLayout } from './light';
export type { DarkTheme, DarkColors, DarkLayout } from './dark';
export type { BaseColors, AppColors, Spacing, Typography, Layout, BorderRadius } from './base';

// Individual theme exports
export { lightTheme } from './light';
export { darkTheme } from './dark';

// Base theme components (for direct access if needed)
export { spacing, typography, layout, borderRadius, baseColors } from './base';

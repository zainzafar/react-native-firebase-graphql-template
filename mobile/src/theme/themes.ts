// Auto-generated themes file - DO NOT EDIT MANUALLY
// Run: npm run generate-themes

import * as darkThemeModule from './dark';
import * as lightThemeModule from './light';

// Auto-discover all theme modules
const themeModules = {
  dark: darkThemeModule,
  light: lightThemeModule,
} as const;

// Auto-generate everything from the modules object
const themeFolders = Object.keys(themeModules) as Array<keyof typeof themeModules>;

// Build themes registry dynamically
const themesRegistry = themeFolders.reduce((acc, folderName) => {
  const module = themeModules[folderName];
  const themeName = `${folderName}Theme` as keyof typeof module;
  acc[folderName] = module[themeName];
  return acc;
}, {} as Record<string, any>);

export const themes = themesRegistry as {
  dark: typeof darkThemeModule.darkTheme;
  light: typeof lightThemeModule.lightTheme;
};

// Type for theme names - automatically derived from themes registry
export type ThemeName = keyof typeof themes;

// Type for theme values
export type Theme = typeof themes[ThemeName];

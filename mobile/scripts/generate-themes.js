#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, '../src/theme');
const outputFile = path.join(themeDir, 'themes.ts');

// Read all directories in theme folder
const directories = fs.readdirSync(themeDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => name !== 'base'); // Exclude base folder

// Generate the themes.ts file
const imports = directories.map(dir => `import * as ${dir}ThemeModule from './${dir}';`).join('\n');

const themeModules = directories.map(dir => `  ${dir}: ${dir}ThemeModule,`).join('\n');

const themeTypes = directories.map(dir => `  ${dir}: typeof ${dir}ThemeModule.${dir}Theme;`).join('\n');

const content = `// Auto-generated themes file - DO NOT EDIT MANUALLY
// Run: npm run generate-themes

${imports}

// Auto-discover all theme modules
const themeModules = {
${themeModules}
} as const;

// Auto-generate everything from the modules object
const themeFolders = Object.keys(themeModules) as Array<keyof typeof themeModules>;

// Build themes registry dynamically
const themesRegistry = themeFolders.reduce((acc, folderName) => {
  const module = themeModules[folderName];
  const themeName = \`\${folderName}Theme\` as keyof typeof module;
  acc[folderName] = module[themeName];
  return acc;
}, {} as Record<string, any>);

export const themes = themesRegistry as {
${themeTypes}
};

// Type for theme names - automatically derived from themes registry
export type ThemeName = keyof typeof themes;

// Type for theme values
export type Theme = typeof themes[ThemeName];
`;

fs.writeFileSync(outputFile, content);
console.log(`✅ Generated themes.ts with ${directories.length} themes: ${directories.join(', ')}`);

# Theme System Documentation

This document explains the scalable theme system used in the mobile app, which supports multiple themes with automatic discovery and type-safe composition.

## Overview

The theme system is designed to be:
- **Scalable**: Easy to add new themes without code changes
- **Type-Safe**: Full TypeScript support with proper interfaces
- **Auto-Discovering**: Automatically finds and registers all themes
- **Composable**: Themes inherit from base values and can override specific properties

## Architecture

```
mobile/src/theme/
├── base/                    # Base theme values (shared across all themes)
│   ├── colors.ts           # Generic AppColors interface
│   ├── spacing.ts          # Spacing values (theme-agnostic)
│   ├── typography.ts       # Typography values (theme-agnostic)
│   ├── layout.ts           # Layout values (theme-agnostic)
│   └── index.ts            # Export all base theme values
├── light/                  # Light theme overrides
│   ├── colors.ts           # Light-specific color overrides
│   ├── layout.ts           # Light-specific layout overrides (optional)
│   └── index.ts            # Export light theme
├── dark/                   # Dark theme overrides
│   ├── colors.ts           # Dark-specific color overrides
│   ├── layout.ts           # Dark-specific layout overrides (optional)
│   └── index.ts            # Export dark theme
├── themes.ts               # Auto-generated themes registry
├── ThemeProvider.tsx       # Main theme provider
└── index.ts                # Main theme exports
```

## Key Components

### 1. Base Theme (`base/`)

Contains all theme-agnostic values that are shared across all themes:

- **`colors.ts`**: Defines the `AppColors` interface that all themes must implement
- **`spacing.ts`**: Spacing values (margins, padding, gaps)
- **`typography.ts`**: Font sizes, weights, line heights
- **`layout.ts`**: Border radius, container layouts, form styles

### 2. Theme Variants (`light/`, `dark/`, etc.)

Each theme folder contains:
- **`colors.ts`**: Theme-specific color overrides
- **`layout.ts`**: Theme-specific layout overrides (optional)
- **`index.ts`**: Theme composition that merges base + overrides

### 3. Auto-Generated Registry (`themes.ts`)

Automatically discovers and registers all themes using a build script.

### 4. Theme Provider (`ThemeProvider.tsx`)

Provides theme context to the entire app with:
- Current theme selection
- Theme switching functionality
- Persistent theme storage
- System theme detection

## Usage

### Basic Usage

```typescript
import { useTheme } from '../theme';

function MyComponent() {
  const { colors, spacing, layout, typography, currentTheme, setTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background, padding: spacing.md }}>
      <Text style={{ color: colors.text, fontSize: typography.sizes.body }}>
        Current theme: {currentTheme}
      </Text>
    </View>
  );
}
```

### Theme Switching

```typescript
const { currentTheme, setTheme } = useTheme();

// Switch to dark theme
setTheme('dark');

// Switch to light theme
setTheme('light');
```

### Checking Current Theme

```typescript
const { currentTheme } = useTheme();

if (currentTheme === 'dark') {
  // Dark theme specific logic
} else if (currentTheme === 'light') {
  // Light theme specific logic
}
```

## Adding New Themes

### Step 1: Create Theme Folder Structure

```bash
mkdir src/theme/black
```

### Step 2: Create Theme Files

**`src/theme/black/colors.ts`**:
```typescript
export const blackColors = {
  background: '#000000',
  card: '#111111',
  text: '#FFFFFF',
  mutedText: '#CCCCCC',
  primary: '#FFFFFF',
  primaryText: '#000000',
  border: '#333333',
  cardBorder: '#333333',
  accent: '#00FF00',
  danger: '#FF0000',
  buttonSuccess: '#00AA00',
  buttonError: '#AA0000',
} as const;

export type BlackColors = typeof blackColors;
```

**`src/theme/black/layout.ts`**:
```typescript
// Black theme layout overrides (optional)
export const blackLayout = {
  // Only define properties that differ from base theme
  // containerGap: 8, // Example override
} as const;

export type BlackLayout = typeof blackLayout;
```

**`src/theme/black/index.ts`**:
```typescript
import { spacing } from '../base/spacing';
import { typography } from '../base/typography';
import { layout, borderRadius } from '../base/layout';
import { blackColors, type BlackColors } from './colors';
import { blackLayout, type BlackLayout } from './layout';

export const blackTheme = {
  spacing,
  typography,
  layout: { ...layout, ...blackLayout },
  borderRadius,
  colors: blackColors,
} as const;

export type BlackTheme = typeof blackTheme;
export type { BlackColors, BlackLayout };
```

### Step 3: Auto-Generate Themes Registry

```bash
npm run generate-themes
```

**That's it!** The system automatically:
- ✅ Discovers the new theme folder
- ✅ Generates all imports and types
- ✅ Updates the themes registry
- ✅ Makes the theme available in ThemeProvider
- ✅ Updates `ThemeName` type to include the new theme

## Theme Composition

Themes are composed by merging base values with theme-specific overrides:

```typescript
export const lightTheme = {
  spacing,        // From base (shared)
  typography,     // From base (shared)
  layout: { ...layout, ...lightLayout }, // Base + overrides
  borderRadius,   // From base (shared)
  colors: lightColors, // Theme-specific
} as const;
```

## Type Safety

The system provides full TypeScript support:

- **`AppColors`**: Generic interface that all themes must implement
- **`ThemeName`**: Automatically derived from available themes
- **`Theme`**: Union type of all theme values
- **Component Types**: All components use generic `AppColors` for scalability

## Auto-Discovery Script

The `scripts/generate-themes.js` script:

1. **Scans** the `src/theme/` directory for folders
2. **Excludes** the `base` folder
3. **Generates** imports for all theme modules
4. **Creates** the themes registry object
5. **Updates** TypeScript types automatically

### Script Usage

```bash
# Generate themes registry
npm run generate-themes

# Output example:
# ✅ Generated themes.ts with 3 themes: black, dark, light
```

## Best Practices

### 1. Theme Structure
- Keep theme-agnostic values in `base/`
- Only override values that differ from base in theme folders
- Use the `AppColors` interface for type safety

### 2. Component Development
- Always use `useTheme()` hook to access theme values
- Use generic `AppColors` type, not specific theme types
- Avoid hardcoded colors or values
- Use `currentTheme` for theme-specific logic

### 3. Adding New Themes
- Follow the established folder structure
- Implement all required `AppColors` properties
- Run `npm run generate-themes` after adding themes
- Test theme switching functionality

### 4. Layout Overrides
- Only override layout values that need to differ from base
- Use object spread to merge with base values
- Consider accessibility when designing theme-specific layouts

## Theme API

The system provides a clean, scalable API for theme management:

- **Current Theme**: `currentTheme` (string: 'light', 'dark', etc.)
- **Theme Switching**: `setTheme(themeName)` function
- **Persistent Storage**: Theme preferences are automatically saved
- **Type Safety**: Full TypeScript support with `ThemeName` type

## Troubleshooting

### Common Issues

1. **Theme Not Found**: Run `npm run generate-themes` after adding new themes
2. **Type Errors**: Ensure all themes implement the `AppColors` interface
3. **Import Errors**: Check that theme folders have proper `index.ts` exports
4. **Storage Issues**: Clear app data if theme switching doesn't persist

### Debugging

```typescript
// Check available themes
console.log('Available themes:', Object.keys(themes));

// Check current theme
console.log('Current theme:', currentTheme);

// Check theme values
console.log('Theme colors:', colors);
```

## Future Enhancements

Potential improvements to the theme system:

1. **Runtime Theme Loading**: Dynamic theme loading for better performance
2. **Theme Validation**: Runtime validation of theme completeness
3. **Theme Preview**: Development tools for theme testing
4. **Accessibility Themes**: Built-in high-contrast and accessibility themes
5. **Theme Analytics**: Track theme usage and preferences

// eslint.config.js (Flat Config for React Native + TypeScript)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginRN from 'eslint-plugin-react-native';
import globals from 'globals';

export default [
  // Files + ignores
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'src/generated/**', // Generated GraphQL types
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules (non type-aware; avoids needing a tsconfig project reference)
  ...tseslint.configs.recommended,

  // Project-wide language options and plugins
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // If you want type-aware rules later, add:
        // project: ['./tsconfig.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // RN globals
        __DEV__: true,
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-native': pluginRN,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React / Hooks
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',

      // General quality tweaks
      'no-unused-vars': 'off', // use TS rule instead
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      
      // Relaxed rules for React Native projects
      '@typescript-eslint/no-explicit-any': 'warn', // Allow 'any' but warn about it
      '@typescript-eslint/no-require-imports': 'off', // Allow require() in config files
      'no-empty': 'off', // Allow empty catch blocks
      'no-useless-catch': 'off', // Allow try/catch wrappers
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty object types
    },
  },
];

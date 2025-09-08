import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { secureGet, secureSet } from '../auth/secureStorage';
import { themes, type ThemeName } from './themes';
import { type Spacing, type Layout, type BorderRadius, type Typography, type AppColors } from './base';

type ThemeContextValue = {
  colors: AppColors;
  spacing: Spacing; // Same across all themes (from base)
  layout: Layout; // Same across all themes (from base)
  borderRadius: BorderRadius; // Same across all themes (from base)
  typography: Typography; // Same across all themes (from base)
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === 'dark';
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(systemDark ? 'dark' : 'light');

  useEffect(() => {
    (async () => {
      const saved = await secureGet('theme', { service: 'app.preferences' });
      if (saved && saved in themes) {
        console.log('saved', saved);
        setCurrentTheme(saved as ThemeName);
      } else {
        console.log('systemDark', systemDark);
        setCurrentTheme(systemDark ? 'dark' : 'light');
      }
    })();
  }, [systemDark]);

  const setTheme = useCallback(async (theme: ThemeName) => {
    setCurrentTheme(theme);
    try { await secureSet('theme', theme, { service: 'app.preferences' }); } catch {}
  }, []);

  const theme = useMemo(() => {
    return themes[currentTheme] || themes.light;
  }, [currentTheme]);

  const value = useMemo(() => ({ 
    colors: theme.colors, 
    spacing: theme.spacing, 
    layout: theme.layout, 
    borderRadius: theme.borderRadius, 
    typography: theme.typography, 
    currentTheme,
    setTheme,
  }), [theme, currentTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


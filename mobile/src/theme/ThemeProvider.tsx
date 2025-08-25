import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { secureGet, secureSet } from '../auth/secureStorage';
import { darkColors, lightColors, AppColors } from './colors';

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  setDarkMode: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === 'dark';
  const [isDark, setIsDark] = useState<boolean>(systemDark);

  useEffect(() => {
    (async () => {
      const saved = await secureGet('dark', { service: 'app.preferences' });
      if (saved === 'true' || saved === 'false') {
        setIsDark(saved === 'true');
      } else {
        setIsDark(systemDark);
      }
    })();
  }, [systemDark]);

  const setDarkMode = async (enabled: boolean) => {
    setIsDark(enabled);
    try { await secureSet('dark', String(enabled), { service: 'app.preferences' }); } catch {}
  };

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const value = useMemo(() => ({ colors, isDark, setDarkMode }), [colors, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


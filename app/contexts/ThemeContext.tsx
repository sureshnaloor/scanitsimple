'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import type { Theme } from '@/app/components/AssetDetails';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function appThemeFromColorMode(colorMode: string | undefined): Theme {
  return colorMode === 'light' ? 'light' : 'default';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme();
  const [theme, setThemeState] = useState<Theme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('app-theme');
    if (stored === 'light' || stored === 'default') {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !resolvedTheme) return;
    setThemeState(appThemeFromColorMode(resolvedTheme));
  }, [mounted, resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const colorMode = newTheme === 'light' ? 'light' : 'dark';
    setNextTheme(colorMode);
    if (mounted) {
      localStorage.setItem('app-theme', newTheme === 'light' ? 'light' : 'default');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}

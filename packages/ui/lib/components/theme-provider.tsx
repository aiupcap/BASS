import React, { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
  forceDark?: boolean;
}

export function ThemeProvider({ children, defaultTheme = 'dark', forceDark = false }: ThemeProviderProps) {
  const theme = 'dark';
  const actualTheme = forceDark ? 'dark' : theme;

  useEffect(() => {
    // If the theme is not set yet, set it to the default
    if (!theme && defaultTheme) {
    }

    // Apply the theme class to the document element
    const root = window.document.documentElement;

    // Remove the previous theme class
    root.classList.remove('light', 'dark');

    // Add the current theme class
    root.classList.add(actualTheme);
  }, [theme, defaultTheme, actualTheme]);

  return <>{children}</>;
}

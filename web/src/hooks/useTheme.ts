'use client';

import { useEffect, useState } from 'react';
import { THEME_OPTIONS, type ThemeId } from '@/constants/themes';

const THEME_STORAGE_KEY = 'loomo-theme';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
    if (savedTheme && THEME_OPTIONS.some(t => t.id === savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeId: ThemeId) => {
    if (themeId === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  const changeTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  };

  return { theme, changeTheme, themes: THEME_OPTIONS };
}

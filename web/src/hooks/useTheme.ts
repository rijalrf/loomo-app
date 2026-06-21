'use client';

import { useEffect, useState } from 'react';
import { THEME_OPTIONS, type ThemeId } from '@/constants/themes';

const THEME_STORAGE_KEY = 'loomo-theme';

const applyTheme = (themeId: ThemeId) => {
  if (typeof window === 'undefined') return;
  if (themeId === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
    if (savedTheme && THEME_OPTIONS.some(t => t.id === savedTheme)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const changeTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  };

  return { theme, changeTheme, themes: THEME_OPTIONS };
}

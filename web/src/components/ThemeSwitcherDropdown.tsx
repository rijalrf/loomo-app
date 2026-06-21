'use client';

import { useTheme } from '@/hooks/useTheme';
import { Check } from 'lucide-react';

export default function ThemeSwitcherDropdown() {
  const { theme, changeTheme, themes } = useTheme();

  return (
    <div className="space-y-1">
      <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider px-2.5 py-1.5">
        Color Theme
      </label>
      <div className="max-h-64 overflow-y-auto space-y-0.5">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTheme(t.id)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-lg text-sm transition-colors cursor-pointer ${
              theme === t.id
                ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
            }`}
          >
            <div className="flex gap-1">
              <div 
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: t.primary }}
              />
              <div 
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: t.secondary }}
              />
            </div>
            <span className="flex-1">{t.name}</span>
            {theme === t.id && <Check size={14} className="text-[var(--primary)] shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useTheme } from '@/hooks/useTheme';

export default function ThemeSwitcher() {
  const { theme, changeTheme, themes } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Color Theme
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTheme(t.id)}
            className={`
              relative p-4 rounded-lg border transition-all duration-200
              ${theme === t.id 
                ? 'border-[var(--primary)] bg-[var(--bg-card)] shadow-lg' 
                : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-zinc-600'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex gap-1.5 mt-1">
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: t.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: t.secondary }}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm text-white mb-0.5">
                  {t.name}
                </div>
                <div className="text-xs text-zinc-400">
                  {t.description}
                </div>
              </div>
            </div>
            {theme === t.id && (
              <div className="absolute top-2 right-2">
                <svg 
                  className="w-5 h-5 text-[var(--primary)]" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

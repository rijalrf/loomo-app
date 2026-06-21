export const THEME_OPTIONS = [
  {
    id: 'default',
    name: 'Dark Blue',
    description: 'Modern professional dark theme with blue accent',
    primary: '#1d4ed8',
    secondary: '#8b5cf6',
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme for bright environments',
    primary: '#2563eb',
    secondary: '#7c3aed',
  },
  {
    id: 'soft-gray',
    name: 'Soft Gray',
    description: 'Comfortable gray theme with soft background',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
  },
  {
    id: 'dark-purple',
    name: 'Dark Purple',
    description: 'Mystical purple theme with pink accent',
    primary: '#a855f7',
    secondary: '#ec4899',
  },
  {
    id: 'dark-emerald',
    name: 'Dark Emerald',
    description: 'Natural green theme with teal accent',
    primary: '#10b981',
    secondary: '#14b8a6',
  },
  {
    id: 'dark-amber',
    name: 'Dark Amber',
    description: 'Warm orange theme with red accent',
    primary: '#f59e0b',
    secondary: '#ef4444',
  },
  {
    id: 'dark-cyan',
    name: 'Dark Cyan',
    description: 'Cool cyan theme with blue accent',
    primary: '#06b6d4',
    secondary: '#3b82f6',
  },
  {
    id: 'oled-black',
    name: 'OLED Black',
    description: 'Pure black theme for OLED displays',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
  },
  {
    id: 'dark-rose',
    name: 'Dark Rose',
    description: 'Elegant rose theme with pink accent',
    primary: '#f43f5e',
    secondary: '#ec4899',
  },
] as const;

export type ThemeId = typeof THEME_OPTIONS[number]['id'];

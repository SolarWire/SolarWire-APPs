export type ViewType = 'file' | 'solarwire' | 'componentLibraryManager';
export type Theme =
  | 'solid-dark'
  | 'solid-light'
  | 'glass-dark'
  | 'glass-light'
  | 'cyberpunk'
  | 'paper'
  | 'minimal';

export const THEME_LIST: { id: Theme; icon: string; label: string }[] = [
  { id: 'solid-dark', icon: '🌑', label: '深色' },
  { id: 'solid-light', icon: '☀️', label: '浅色' },
  { id: 'glass-dark', icon: '🔮', label: '毛玻璃深色' },
  { id: 'glass-light', icon: '💎', label: '毛玻璃浅色' },
  { id: 'cyberpunk', icon: '⚡', label: '赛博朋克' },
  { id: 'paper', icon: '📄', label: '纸质' },
  { id: 'minimal', icon: '⬜', label: '极简' },
];

const THEME_MIGRATION: Record<string, Theme> = {
  'dark': 'solid-dark',
  'light': 'solid-light',
};

export function migrateTheme(raw: string | null): Theme {
  if (!raw) return 'solid-dark';
  if (THEME_MIGRATION[raw]) return THEME_MIGRATION[raw];
  if (THEME_LIST.some(t => t.id === raw)) return raw as Theme;
  return 'solid-dark';
}

const DARK_THEMES: Theme[] = ['solid-dark', 'glass-dark', 'cyberpunk'];

export function isDarkTheme(theme: Theme): boolean {
  return DARK_THEMES.includes(theme);
}

export function getNextTheme(current: Theme): Theme {
  const idx = THEME_LIST.findIndex(t => t.id === current);
  const nextIdx = (idx + 1) % THEME_LIST.length;
  return THEME_LIST[nextIdx].id;
}

export interface AppState {
  currentView: ViewType;
  theme: Theme;
  settingsModalOpen: boolean;
  setCurrentView: (view: ViewType) => void;
  setTheme: (theme: Theme) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

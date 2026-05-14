import { create } from 'zustand';
import { AppState, Theme, migrateTheme } from '../../shared/types/app';

const getSavedTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('solarwire-theme');
    return migrateTheme(saved);
  } catch {
    return 'solid-dark';
  }
};

const savedTheme = getSavedTheme();

const applyThemeToDOM = (theme: Theme) => {
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ')
    .trim();
  document.body.classList.add(`theme-${theme}`);
};

if (typeof document !== 'undefined') {
  applyThemeToDOM(savedTheme);
}

export const useAppStore = create<AppState>()((set) => ({
  currentView: 'file',
  theme: savedTheme,
  settingsModalOpen: false,
  setCurrentView: (view) => set({ currentView: view }),
  setTheme: (theme: Theme) => {
    set({ theme });
    try {
      localStorage.setItem('solarwire-theme', theme);
    } catch {}
    applyThemeToDOM(theme);
  },
  openSettings: () => set({ settingsModalOpen: true }),
  closeSettings: () => set({ settingsModalOpen: false }),
}));

import { create } from 'zustand';
import { AppState, ViewType, Theme } from '../types/app';

// 从 localStorage 读取保存的主题，默认为 'dark'
const getSavedTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('solarwire-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  } catch {
    return 'dark';
  }
};

const savedTheme = getSavedTheme();

export const useAppStore = create<AppState>((set) => ({
  currentView: 'file',
  theme: savedTheme,
  setCurrentView: (view: ViewType) => set({ currentView: view }),
  setTheme: (theme: Theme) => {
    set({ theme });
    try {
      localStorage.setItem('solarwire-theme', theme);
    } catch {
      // 忽略 localStorage 错误
    }
    if (theme === 'dark') {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
  },
}));

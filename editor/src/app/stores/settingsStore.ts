import { create } from 'zustand';

const defaultFavoriteColors = [
  '#333333',
  '#AAAAAA',
  '#F2F2F2',
  '#FFFFFF',
  '#1890FF',
  '#D9001B',
  '#FFDF25',
  '#70B603'
];

export interface SettingsState {
  gitName: string;
  gitEmail: string;
  primaryColor: string;
  favoriteColors: string[];
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  setGitName: (name: string) => void;
  setGitEmail: (email: string) => void;
  setPrimaryColor: (color: string) => void;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

const defaultSettings = {
  gitName: '',
  gitEmail: '',
  primaryColor: '#FCA506',
  favoriteColors: defaultFavoriteColors,
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  setGitName: (name: string) => {
    set({ gitName: name });
    get().saveSettings();
  },

  setGitEmail: (email: string) => {
    set({ gitEmail: email });
    get().saveSettings();
  },

  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
    get().saveSettings();
    // 应用到 CSS 变量
    document.documentElement.style.setProperty('--accent-color', color);
  },

  addFavoriteColor: (color: string) => {
    const { favoriteColors } = get();
    // 确保颜色格式一致（去重）
    const normalizedColor = color.toUpperCase();
    if (!favoriteColors.includes(normalizedColor)) {
      const newColors = [...favoriteColors, normalizedColor].slice(-20); // 最多20个
      set({ favoriteColors: newColors });
      get().saveSettings();
    }
  },

  removeFavoriteColor: (color: string) => {
    const { favoriteColors } = get();
    const normalizedColor = color.toUpperCase();
    const newColors = favoriteColors.filter(c => c.toUpperCase() !== normalizedColor);
    set({ favoriteColors: newColors });
    get().saveSettings();
  },

  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
    get().saveSettings();
  },

  setGridSize: (size: number) => {
    set({ gridSize: size });
    get().saveSettings();
  },

  setSnapToGrid: (snap: boolean) => {
    set({ snapToGrid: snap });
    get().saveSettings();
  },

  loadSettings: () => {
    try {
      const saved = localStorage.getItem('solarwire-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        set({
          gitName: parsed.gitName || defaultSettings.gitName,
          gitEmail: parsed.gitEmail || defaultSettings.gitEmail,
          primaryColor: parsed.primaryColor || defaultSettings.primaryColor,
          favoriteColors: parsed.favoriteColors || defaultSettings.favoriteColors,
          showGrid: parsed.showGrid ?? defaultSettings.showGrid,
          gridSize: parsed.gridSize || defaultSettings.gridSize,
          snapToGrid: parsed.snapToGrid ?? defaultSettings.snapToGrid,
        });
        // 应用主色
        document.documentElement.style.setProperty('--accent-color', parsed.primaryColor || defaultSettings.primaryColor);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  saveSettings: () => {
    try {
      const { gitName, gitEmail, primaryColor, favoriteColors, showGrid, gridSize, snapToGrid } = get();
      localStorage.setItem('solarwire-settings', JSON.stringify({
        gitName,
        gitEmail,
        primaryColor,
        favoriteColors,
        showGrid,
        gridSize,
        snapToGrid,
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}));

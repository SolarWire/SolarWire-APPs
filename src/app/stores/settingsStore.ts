import { create } from 'zustand';
import { feedback } from './feedbackStore';

type SelectionTool = 'select' | 'box-include' | 'box-intersect';

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
  favoriteColors: string[];
  noteTextareaHeight: number;
  textTextareaHeight: number;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
  resetFavoriteColors: () => void;
  setNoteTextareaHeight: (height: number) => void;
  setTextTextareaHeight: (height: number) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

const defaultSettings = {
  favoriteColors: defaultFavoriteColors,
  noteTextareaHeight: 120,
  textTextareaHeight: 120,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  addFavoriteColor: (color: string) => {
    const { favoriteColors } = get();
    const normalizedColor = color.toUpperCase();
    if (!favoriteColors.includes(normalizedColor)) {
      const newColors = [...favoriteColors, normalizedColor].slice(-20);
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

  resetFavoriteColors: () => {
    set({ favoriteColors: defaultFavoriteColors });
    get().saveSettings();
  },

  setNoteTextareaHeight: (height: number) => {
    set({ noteTextareaHeight: height });
    get().saveSettings();
  },

  setTextTextareaHeight: (height: number) => {
    set({ textTextareaHeight: height });
    get().saveSettings();
  },

  loadSettings: () => {
    try {
      const saved = localStorage.getItem('solarwire-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        set({
          favoriteColors: parsed.favoriteColors || defaultSettings.favoriteColors,
          noteTextareaHeight: parsed.noteTextareaHeight || defaultSettings.noteTextareaHeight,
          textTextareaHeight: parsed.textTextareaHeight || defaultSettings.textTextareaHeight,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      feedback.toast.error('Failed to load settings');
    }
  },

  saveSettings: () => {
    try {
      const { favoriteColors, noteTextareaHeight, textTextareaHeight } = get();
      localStorage.setItem('solarwire-settings', JSON.stringify({
        favoriteColors,
        noteTextareaHeight,
        textTextareaHeight,
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      feedback.toast.error('Failed to save settings');
    }
  }
}));

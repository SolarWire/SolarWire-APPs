import { create } from 'zustand';
import { eventBus, EditorEvents } from '../../shared/utils/EventBus';
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
  primaryColor: string;
  favoriteColors: string[];
  selectionTool: SelectionTool;
  noteTextareaHeight: number;
  textTextareaHeight: number;
  setPrimaryColor: (color: string) => void;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
  resetFavoriteColors: () => void;
  setSelectionTool: (tool: SelectionTool) => void;
  setNoteTextareaHeight: (height: number) => void;
  setTextTextareaHeight: (height: number) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

const defaultSettings = {
  primaryColor: '#FCA506',
  favoriteColors: defaultFavoriteColors,
  selectionTool: 'select' as SelectionTool,
  noteTextareaHeight: 120,
  textTextareaHeight: 120,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
    get().saveSettings();
    document.documentElement.style.setProperty('--accent-color', color);
  },

  setSelectionTool: (tool: SelectionTool) => {
    set({ selectionTool: tool });
    get().saveSettings();
  },

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
          primaryColor: parsed.primaryColor || defaultSettings.primaryColor,
          favoriteColors: parsed.favoriteColors || defaultSettings.favoriteColors,
          selectionTool: parsed.selectionTool || defaultSettings.selectionTool,
          noteTextareaHeight: parsed.noteTextareaHeight || defaultSettings.noteTextareaHeight,
          textTextareaHeight: parsed.textTextareaHeight || defaultSettings.textTextareaHeight,
        });
        document.documentElement.style.setProperty('--accent-color', parsed.primaryColor || defaultSettings.primaryColor);
      }
      
      // 监听来自 solarWireStore 的 selectionTool 变化
      eventBus.on(EditorEvents.SETTINGS_CHANGED, (data: { selectionTool?: SelectionTool }) => {
        if (data.selectionTool !== undefined) {
          set({ selectionTool: data.selectionTool });
          get().saveSettings();
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      feedback.toast.error('Failed to load settings');
    }
  },

  saveSettings: () => {
    try {
      const { primaryColor, favoriteColors, selectionTool, noteTextareaHeight, textTextareaHeight } = get();
      localStorage.setItem('solarwire-settings', JSON.stringify({
        primaryColor,
        favoriteColors,
        selectionTool,
        noteTextareaHeight,
        textTextareaHeight,
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      feedback.toast.error('Failed to save settings');
    }
  }
}));

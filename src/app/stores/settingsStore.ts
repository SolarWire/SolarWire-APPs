import { create } from 'zustand';
import { eventBus, EditorEvents } from '../../shared/utils/EventBus';
import { showToast } from '../services/toast-service';

type SelectionTool = 'select' | 'box-include' | 'box-intersect';
type RenderMode = 'svg' | 'canvas';

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
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  selectionTool: SelectionTool;
  noteTextareaHeight: number;
  renderMode: RenderMode;
  setPrimaryColor: (color: string) => void;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
  resetFavoriteColors: () => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setSelectionTool: (tool: SelectionTool) => void;
  setNoteTextareaHeight: (height: number) => void;
  setRenderMode: (mode: RenderMode) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

const defaultSettings = {
  primaryColor: '#FCA506',
  favoriteColors: defaultFavoriteColors,
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
  selectionTool: 'select' as SelectionTool,
  noteTextareaHeight: 120,
  renderMode: 'svg' as RenderMode,
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

  setNoteTextareaHeight: (height: number) => {
    set({ noteTextareaHeight: height });
    get().saveSettings();
  },

  setRenderMode: (mode: RenderMode) => {
    set({ renderMode: mode });
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
          showGrid: parsed.showGrid ?? defaultSettings.showGrid,
          gridSize: parsed.gridSize || defaultSettings.gridSize,
          snapToGrid: parsed.snapToGrid ?? defaultSettings.snapToGrid,
          selectionTool: parsed.selectionTool || defaultSettings.selectionTool,
          renderMode: parsed.renderMode || defaultSettings.renderMode,
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
      showToast('Failed to load settings', 'error');
    }
  },

  saveSettings: () => {
    try {
      const { primaryColor, favoriteColors, showGrid, gridSize, snapToGrid, selectionTool, renderMode } = get();
      localStorage.setItem('solarwire-settings', JSON.stringify({
        primaryColor,
        favoriteColors,
        showGrid,
        gridSize,
        snapToGrid,
        selectionTool,
        renderMode,
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    }
  }
}));

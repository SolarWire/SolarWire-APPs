import { create } from 'zustand';
import { EditorState, EditorMode } from '../types/editor';

export const useEditorStore = create<EditorState>((set, get) => ({
  mode: 'solarwire',
  content: '',
  isModified: false,
  isLoading: false,
  loadingMessage: undefined,
  history: [],
  historyIndex: -1,

  setMode: (mode: EditorMode) => set({ mode }),

  setContent: (newContent: string) => {
    const { content: currentContent } = get();

    if (currentContent !== newContent) {
      set((state) => {
        const newHistory = [...state.history];
        newHistory.push(currentContent);

        if (newHistory.length > 50) {
          newHistory.shift();
        }

        return {
          content: newContent,
          isModified: true,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      });
    }
  },

  setModified: (modified: boolean) => set({ isModified: modified }),

  setLoading: (loading: boolean, message?: string) =>
    set({ isLoading: loading, loadingMessage: message }),

  undo: () => {
    const { history, historyIndex } = get();

    if (historyIndex >= 0 && history.length > 0) {
      const previousContent = history[historyIndex];
      set({
        content: previousContent,
        isModified: true,
        historyIndex: historyIndex - 1
      });
    }
  },

  redo: () => {
    const { history, historyIndex, content: currentContent } = get();

    if (historyIndex < history.length - 1) {
      const nextContent = history[historyIndex + 1];
      set({
        content: nextContent,
        isModified: true,
        historyIndex: historyIndex + 1
      });
    }
  },

  resetHistory: () => {
    set({
      history: [],
      historyIndex: -1
    });
  }
}));

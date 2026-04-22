import { create } from 'zustand';

export interface SwcContentState {
  content: string;
  originalContent: string;
  setContent: (content: string) => void;
  resetContent: () => void;
  isModified: () => boolean;
}

export const useSwcContentStore = create<SwcContentState>()((set, get) => ({
  content: '',
  originalContent: '',

  setContent: (content: string) => {
    set({ content });
  },

  resetContent: () => {
    const { originalContent } = get();
    set({ content: originalContent });
  },

  isModified: () => {
    const { content, originalContent } = get();
    return content !== originalContent;
  },
}));

export function createSwcContentStore(initialContent: string = '') {
  return create<SwcContentState>()((set, get) => ({
    content: initialContent,
    originalContent: initialContent,

    setContent: (content: string) => {
      set({ content });
    },

    resetContent: () => {
      const { originalContent } = get();
      set({ content: originalContent });
    },

    isModified: () => {
      const { content, originalContent } = get();
      return content !== originalContent;
    },
  }));
}

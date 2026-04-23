import { create } from 'zustand';
import type { ClipboardElementData } from './types';

interface ClipboardState {
  hasContent: boolean;
  elements: ClipboardElementData[];
  referencePosition: { x: number; y: number } | null;
  timestamp: number;
  rawContent: string;

  setClipboardContent: (
    elements: ClipboardElementData[],
    referencePos: { x: number; y: number },
    rawContent: string
  ) => void;
  clearClipboard: () => void;
  getRelativePosition: (elementId: string) => { dx: number; dy: number } | null;
  hasImages: () => boolean;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  hasContent: false,
  elements: [],
  referencePosition: null,
  timestamp: 0,
  rawContent: '',

  setClipboardContent: (
    elements: ClipboardElementData[],
    referencePos: { x: number; y: number },
    rawContent: string
  ) => {
    set({
      hasContent: true,
      elements,
      referencePosition: referencePos,
      timestamp: Date.now(),
      rawContent
    });
  },

  clearClipboard: () => {
    set({
      hasContent: false,
      elements: [],
      referencePosition: null,
      timestamp: 0,
      rawContent: ''
    });
  },

  getRelativePosition: (elementId: string) => {
    const { elements, referencePosition } = get();
    if (!referencePosition) return null;

    const element = elements.find(el => el.id === elementId);
    if (!element) return null;

    return {
      dx: element.originalX - referencePosition.x,
      dy: element.originalY - referencePosition.y
    };
  },

  hasImages: () => {
    const { elements } = get();
    return elements.some(el => el.type === 'image');
  }
}));

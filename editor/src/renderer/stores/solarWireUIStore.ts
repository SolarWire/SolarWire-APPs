import { create } from 'zustand';

interface SolarWireUIState {
  showNotes: boolean;
  zoomLevel: number;
  isSpacePressed: boolean;
  setShowNotes: (show: boolean) => void;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setIsSpacePressed: (pressed: boolean) => void;
}

export const useSolarWireUIStore = create<SolarWireUIState>((set) => ({
  showNotes: true,
  zoomLevel: 100,
  isSpacePressed: false,
  setShowNotes: (show) => set({ showNotes: show }),
  setZoomLevel: (zoom) => set((state) => ({
    zoomLevel: typeof zoom === 'function' ? zoom(state.zoomLevel) : zoom
  })),
  setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
}));
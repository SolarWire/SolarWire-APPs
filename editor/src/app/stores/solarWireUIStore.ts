import { create } from 'zustand';

interface SolarWireUIState {
  showNotes: boolean;
  zoomLevel: number;
  isSpacePressed: boolean;
  setShowNotes: (show: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  setIsSpacePressed: (pressed: boolean) => void;
}

export const useSolarWireUIStore = create<SolarWireUIState>((set) => ({
  showNotes: true,
  zoomLevel: 100,
  isSpacePressed: false,
  setShowNotes: (show) => set({ showNotes: show }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
}));
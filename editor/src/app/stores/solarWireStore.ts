import { create } from 'zustand';

type SelectionTool = 'select' | 'box-include' | 'box-intersect';

interface SolarWireState {
  selectedElements: string[];
  selectionTool: SelectionTool;
  isPanMode: boolean;
  dragState: any;
  resizeState: any;
  showNotes: boolean;
  zoomLevel: number;
  isSpacePressed: boolean;
  isPreviewFocused: boolean;
  selectElements: (ids: string[]) => void;
  setSelectedElements: (ids: string[]) => void;
  setSelectionTool: (tool: SelectionTool) => void;
  setIsPanMode: (isPanMode: boolean) => void;
  setDragState: (state: any) => void;
  setResizeState: (state: any) => void;
  setShowNotes: (show: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  setIsSpacePressed: (pressed: boolean) => void;
  setIsPreviewFocused: (focused: boolean) => void;
}

export const useSolarWireStore = create<SolarWireState>((set) => ({
  selectedElements: [],
  selectionTool: 'box-intersect',
  isPanMode: false,
  dragState: null,
  resizeState: null,
  showNotes: true,
  zoomLevel: 100,
  isSpacePressed: false,
  isPreviewFocused: false,

  selectElements: (ids: string[]) => set({ selectedElements: ids }),
  setSelectedElements: (ids: string[]) => set({ selectedElements: ids }),
  setSelectionTool: (tool: SelectionTool) => set({ selectionTool: tool }),
  setIsPanMode: (isPanMode: boolean) => set({ isPanMode }),
  setDragState: (state: any) => set({ dragState: state }),
  setResizeState: (state: any) => set({ resizeState: state }),
  setShowNotes: (show) => set({ showNotes: show }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
  setIsPreviewFocused: (focused) => set({ isPreviewFocused: focused }),
}));

export type { SelectionTool };

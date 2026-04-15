import { create } from 'zustand';

type SelectionTool = 'select' | 'box-inclusive';

interface SolarWireState {
  selectedElements: string[];
  selectionTool: SelectionTool;
  isPanMode: boolean; // 视角移动状态
  dragState: any;
  resizeState: any;
  selectElements: (ids: string[]) => void;
  setSelectionTool: (tool: SelectionTool) => void;
  setIsPanMode: (isPanMode: boolean) => void;
  setDragState: (state: any) => void;
  setResizeState: (state: any) => void;
}

export const useSolarWireStore = create<SolarWireState>((set) => ({
  selectedElements: [],
  selectionTool: 'box-inclusive',
  isPanMode: false,
  dragState: null,
  resizeState: null,

  selectElements: (ids: string[]) => set({ selectedElements: ids }),
  setSelectionTool: (tool: SelectionTool) => set({ selectionTool: tool }),
  setIsPanMode: (isPanMode: boolean) => set({ isPanMode }),
  setDragState: (state: any) => set({ dragState: state }),
  setResizeState: (state: any) => set({ resizeState: state }),
}));

export type { SelectionTool };

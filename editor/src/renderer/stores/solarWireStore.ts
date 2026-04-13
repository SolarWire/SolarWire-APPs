import { create } from 'zustand';

type SelectionTool = 'select' | 'box-inclusive';

interface SolarWireState {
  selectedElements: string[];
  selectionTool: SelectionTool;
  isPanMode: boolean; // 视角移动状态
  dragState: any;
  resizeState: any;
  hoveredElement: string | null;
  selectElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;
  clearSelection: () => void;
  setSelectionTool: (tool: SelectionTool) => void;
  setIsPanMode: (isPanMode: boolean) => void;
  setDragState: (state: any) => void;
  setResizeState: (state: any) => void;
  setHoveredElement: (id: string | null) => void;
}

export const useSolarWireStore = create<SolarWireState>((set) => ({
  selectedElements: [],
  selectionTool: 'box-inclusive',
  isPanMode: false,
  dragState: null,
  resizeState: null,
  hoveredElement: null,

  selectElements: (ids: string[]) => set({ selectedElements: ids }),
  
  toggleElementSelection: (id: string) => set((state) => {
    const isSelected = state.selectedElements.includes(id);
    
    if (isSelected) {
      return { selectedElements: state.selectedElements.filter(eid => eid !== id) };
    } else {
      return { selectedElements: [...state.selectedElements, id] };
    }
  }),
  
  clearSelection: () => set({ selectedElements: [] }),
  
  setSelectionTool: (tool: SelectionTool) => set({ selectionTool: tool }),
  setIsPanMode: (isPanMode: boolean) => set({ isPanMode }),
  setDragState: (state: any) => set({ dragState: state }),
  setResizeState: (state: any) => set({ resizeState: state }),
  setHoveredElement: (id: string | null) => set({ hoveredElement: id }),
}));

export type { SelectionTool };

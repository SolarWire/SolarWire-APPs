import { create } from 'zustand';
import type { AlignmentGuide, DistanceLine } from '../components/editor/snap';

export type { AlignmentGuide, DistanceLine } from '../components/editor/snap';

export interface BoxSelectionState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface MultiDragState {
  elementId: string;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}

export interface DragElementState {
  elementId: string;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}

export interface ResizeHandleState {
  elementId: string;
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | 'start' | 'end';
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementW?: number;
  elementH?: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}

export interface DragPreviewElement {
  type: string;
  x: number;
  y: number;
  code?: string;
}

interface PreviewState {
  scale: number;
  position: { x: number; y: number };
  isDraggingCanvas: boolean;
  dragStart: { x: number; y: number };
  isInitialized: boolean;

  boxSelection: BoxSelectionState | null;
  dragElementState: DragElementState | null;
  multiDragElements: MultiDragState[];
  resizeHandleState: ResizeHandleState | null;
  dragPreviewElement: DragPreviewElement | null;

  hoveredElement: string | null;
  dropOverlay: boolean;
  error: string | null;
  alignmentGuides: AlignmentGuide[];
  distanceLines: DistanceLine[];
  altKeyPressed: boolean;
}

interface PreviewActions {
  setScale: (scale: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  startCanvasDrag: (startX: number, startY: number) => void;
  endCanvasDrag: () => void;
  setIsInitialized: (initialized: boolean) => void;

  setBoxSelection: (state: BoxSelectionState | null) => void;
  setDragElementState: (state: DragElementState | null) => void;
  setMultiDragElements: (elements: MultiDragState[]) => void;
  setResizeHandleState: (state: ResizeHandleState | null) => void;
  setDragPreviewElement: (element: DragPreviewElement | null) => void;

  setHoveredElement: (elementId: string | null) => void;
  setDropOverlay: (show: boolean) => void;
  setError: (error: string | null) => void;
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;
  setDistanceLines: (lines: DistanceLine[]) => void;
  setAltKeyPressed: (pressed: boolean) => void;

  resetInteractionStates: () => void;
}

export type PreviewStore = PreviewState & PreviewActions;

const initialInteractionState = {
  boxSelection: null as BoxSelectionState | null,
  dragElementState: null as DragElementState | null,
  multiDragElements: [] as MultiDragState[],
  resizeHandleState: null as ResizeHandleState | null,
  dragPreviewElement: null as DragPreviewElement | null,
  alignmentGuides: [] as AlignmentGuide[],
  distanceLines: [] as DistanceLine[],
};

export const usePreviewStore = create<PreviewStore>((set) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  isDraggingCanvas: false,
  dragStart: { x: 0, y: 0 },
  isInitialized: false,

  boxSelection: null,
  dragElementState: null,
  multiDragElements: [],
  resizeHandleState: null,
  dragPreviewElement: null,

  hoveredElement: null,
  dropOverlay: false,
  error: null,
  alignmentGuides: [],
  distanceLines: [],
  altKeyPressed: false,

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  startCanvasDrag: (startX, startY) => set({
    isDraggingCanvas: true,
    dragStart: { x: startX, y: startY }
  }),
  endCanvasDrag: () => set({
    isDraggingCanvas: false,
    dragStart: { x: 0, y: 0 }
  }),
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),

  setBoxSelection: (state) => set({ boxSelection: state }),
  setDragElementState: (state) => set({ dragElementState: state }),
  setMultiDragElements: (elements) => set({ multiDragElements: elements }),
  setResizeHandleState: (state) => set({ resizeHandleState: state }),
  setDragPreviewElement: (element) => set({ dragPreviewElement: element }),

  setHoveredElement: (elementId) => set({ hoveredElement: elementId }),
  setDropOverlay: (show) => set({ dropOverlay: show }),
  setError: (error) => set({ error }),
  setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),
  setDistanceLines: (lines) => set({ distanceLines: lines }),
  setAltKeyPressed: (pressed) => set({ altKeyPressed: pressed }),

  resetInteractionStates: () => set(initialInteractionState),
}));

import { create } from 'zustand';

export type GuideType =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'centerX' | 'centerY'
  | 'spacingX' | 'spacingY'
  | 'canvasLeft' | 'canvasRight' | 'canvasTop' | 'canvasBottom' | 'canvasCenterX' | 'canvasCenterY'
  | 'distributeX' | 'distributeY'
  | 'userH' | 'userV';

export interface AlignmentGuide {
  type: GuideType;
  position: number;
  distance?: number;
  sourceElementId?: string;
  sourceBounds?: { x: number; y: number; w: number; h: number };
  relatedElementIds?: string[];
  priority: number;
  isSnapped: boolean;
  isNearby?: boolean;
  targetBounds?: { x: number; y: number; w: number; h: number };
  currentEdge?: number;
  isHorizontal?: boolean;
}

export interface EdgeGap {
  type: string;
  targetBounds: { x: number; y: number; w: number; h: number };
  distance: number;
  currentEdge: number;
  targetEdge: number;
  hasOverlap: boolean;
  overlapStart: number;
  overlapEnd: number;
}

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
  edgeGaps: EdgeGap[];
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
  setEdgeGaps: (gaps: EdgeGap[]) => void;
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
  edgeGaps: [] as EdgeGap[],
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
  edgeGaps: [],
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
  setEdgeGaps: (gaps) => set({ edgeGaps: gaps }),
  setAltKeyPressed: (pressed) => set({ altKeyPressed: pressed }),

  resetInteractionStates: () => set(initialInteractionState),
}));

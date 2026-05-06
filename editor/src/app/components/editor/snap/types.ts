export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SnapElement {
  id: string;
  bounds: Bounds;
}

export type GuideType =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'centerX' | 'centerY'
  | 'spacingX' | 'spacingY'
  | 'canvasLeft' | 'canvasTop'
  | 'distributeX' | 'distributeY';

export interface BaseGuide {
  type: GuideType;
  position: number;
  priority: number;
  isSnapped: boolean;
  isNearby?: boolean;
  distance?: number;
}

export interface ElementAlignGuide extends BaseGuide {
  type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
  sourceElementId: string;
  sourceBounds: Bounds;
}

export interface CanvasGuide extends BaseGuide {
  type: 'canvasLeft' | 'canvasTop';
}

export interface SpacingGuide extends BaseGuide {
  type: 'spacingX' | 'spacingY';
  distance: number;
  relatedElementIds: string[];
}

export interface DistributeGuide extends BaseGuide {
  type: 'distributeX' | 'distributeY';
  distance: number;
  relatedElementIds: string[];
}

export type AlignmentGuide =
  | ElementAlignGuide
  | CanvasGuide
  | SpacingGuide
  | DistributeGuide;

export interface ActiveEdges {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

export interface SnapResult {
  x: number;
  y: number;
  w: number;
  h: number;
  snapped: boolean;
  snappedGuides: AlignmentGuide[];
  nearbyGuides: AlignmentGuide[];
}

export interface DistanceLine {
  axis: 'x' | 'y';
  currentEdge: number;
  targetEdge: number;
  distance: number;
  hasOverlap: boolean;
  overlapStart: number;
  overlapEnd: number;
  targetBounds: Bounds;
}

export interface GuideTypeStrategy {
  axis: 'x' | 'y';
  isHorizontal: boolean;
  isActive: (activeEdges: ActiveEdges) => boolean;
  getCurrentEdge: (bounds: Bounds) => number;
  computeSnappedPosition: (guidePosition: number, bounds: Bounds) => number;
}

export interface CollectContext {
  currentBounds: Bounds;
  excludeIds: string[];
  elements: SnapElement[];
  threshold: number;
}

export interface RenderContext {
  viewBox: { x: number; y: number; width: number; height: number } | null;
  scale: number;
  primaryColor: string;
}

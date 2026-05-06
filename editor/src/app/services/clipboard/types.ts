export type ElementType =
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'line'
  | 'image'
  | 'placeholder'
  | 'table'
  | 'unknown';

export interface ClipboardElementData {
  id: string;
  lineNumber: number;
  content: string;
  type: ElementType;
  originalX: number;
  originalY: number;
  imagePath?: string;
  imageBase64?: string;
}

export interface RelativePosition {
  dx: number;
  dy: number;
}

export interface CopyOptions {
  elementIds: string[];
  content: string;
  fileDir?: string;
}

export interface PasteOptions {
  content: string;
  targetPosition: { x: number; y: number };
  selectedElementId?: string;
  setContent: (content: string) => void;
  setSelectedElements: (ids: string[]) => void;
  fileDir?: string;
}

export interface CopyResult {
  success: boolean;
  elementCount: number;
  hasImages: boolean;
  error?: string;
}

export interface PasteResult {
  success: boolean;
  newContent: string;
  newElementIds: string[];
  error?: string;
}

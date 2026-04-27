export type EditorMode = 'blank' | 'markdown' | 'solarwire' | 'image';

export interface EditorState {
  mode: EditorMode;
  content: string;
  isModified: boolean;
  history: string[];
  historyIndex: number;
  setMode: (mode: EditorMode) => void;
  setContent: (content: string) => void;
  setModified: (modified: boolean) => void;
  undo: () => void;
}

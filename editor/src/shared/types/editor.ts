export type EditorMode = 'blank' | 'markdown' | 'solarwire' | 'image' | 'componentLibraryManager' | 'table';

export interface EditorState {
  mode: EditorMode;
  content: string;
  isModified: boolean;
  history: string[];
  historyIndex: number;
  setMode: (mode: EditorMode) => void;
  setContent: (content: string) => void;
  commitContent: (content: string, snapshot: string) => void;
  setModified: (modified: boolean) => void;
  clearHistory: () => void;
  undo: () => void;
}

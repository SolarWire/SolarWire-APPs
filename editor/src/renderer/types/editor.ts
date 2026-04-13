export type EditorMode = 'blank' | 'markdown' | 'solarwire' | 'version' | 'git';

export interface EditorState {
  mode: EditorMode;
  content: string;
  isModified: boolean;
  isLoading: boolean;
  loadingMessage?: string;
  history: string[];
  historyIndex: number;
  setMode: (mode: EditorMode) => void;
  setContent: (content: string) => void;
  setModified: (modified: boolean) => void;
  setLoading: (loading: boolean, message?: string) => void;
  undo: () => void;
  redo: () => void;
}

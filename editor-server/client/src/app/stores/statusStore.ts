import { create } from 'zustand';

export interface FileStatus {
  isModified: boolean;
  encoding: string;
  lineCount: number;
  cursorPosition: { line: number; column: number };
  selectionCount: number;
}

export interface EditorStatus {
  mode: 'markdown' | 'solarwire' | 'unsupported';
  zoom: number;
  elementCount: number;
  selectedElementCount: number;
}

interface StatusState {
  filePath: string;
  fileStatus: FileStatus;
  editorStatus: EditorStatus;

  setCurrentFilePath: (path: string) => void;
  updateFileStatus: (status: Partial<FileStatus>) => void;
  updateEditorStatus: (status: Partial<EditorStatus>) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  filePath: '',
  fileStatus: {
    isModified: false,
    encoding: 'UTF-8',
    lineCount: 0,
    cursorPosition: { line: 1, column: 1 },
    selectionCount: 0,
  },
  editorStatus: {
    mode: 'markdown',
    zoom: 100,
    elementCount: 0,
    selectedElementCount: 0,
  },

  setCurrentFilePath: (path: string) => {
    set({ filePath: path });
  },

  updateFileStatus: (status: Partial<FileStatus>) => {
    set((state) => ({
      fileStatus: { ...state.fileStatus, ...status },
    }));
  },

  updateEditorStatus: (status: Partial<EditorStatus>) => {
    set((state) => ({
      editorStatus: { ...state.editorStatus, ...status },
    }));
  },
}));

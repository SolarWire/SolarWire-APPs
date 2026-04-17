import { create } from 'zustand';

export type OperationType = 
  | 'save' 
  | 'open' 
  | 'git-commit' 
  | 'git-push' 
  | 'git-pull' 
  | 'load' 
  | 'version' 
  | 'git-analysis';

export type OperationStatus = 'idle' | 'running' | 'success' | 'error';

export interface OperationState {
  type: OperationType;
  status: OperationStatus;
  message: string;
  errorDetail?: string;
  startTime?: number;
}

interface StatusState {
  currentOperation: OperationState | null;
  filePath: string;

  // Actions
  setCurrentFilePath: (path: string) => void;
  startOperation: (type: OperationType, message?: string) => void;
  completeOperation: (message?: string) => void;
  failOperation: (message: string, errorDetail?: string) => void;
  clearOperation: () => void;
}

const operationIcons: Record<OperationType, string> = {
  'save': '💾',
  'open': '📂',
  'git-commit': '📝',
  'git-push': '⬆️',
  'git-pull': '⬇️',
  'load': '🔄',
  'version': '📋',
  'git-analysis': '🔍',
};

export const useStatusStore = create<StatusState>((set) => ({
  currentOperation: null,
  filePath: '',

  setCurrentFilePath: (path: string) => {
    set({ filePath: path });
  },

  startOperation: (type: OperationType, message?: string) => {
    set({
      currentOperation: {
        type,
        status: 'running',
        message: message || '处理中...',
        startTime: Date.now(),
      },
    });
  },

  completeOperation: (message?: string) => {
    set((state) => ({
      currentOperation: state.currentOperation
        ? {
            ...state.currentOperation,
            status: 'success',
            message: message || '完成',
          }
        : null,
    }));
  },

  failOperation: (message: string, errorDetail?: string) => {
    set((state) => ({
      currentOperation: state.currentOperation
        ? {
            ...state.currentOperation,
            status: 'error',
            message,
            errorDetail,
          }
        : null,
    }));
  },

  clearOperation: () => {
    set({ currentOperation: null });
  },
}));

// Helper to get operation icon
export function getOperationIcon(type: OperationType): string {
  return operationIcons[type];
}

import { create } from 'zustand';

// 操作类型 - 移除Git相关，增加编辑器相关
export type OperationType = 
  | 'save' 
  | 'open' 
  | 'load' 
  | 'version'
  | 'parse'
  | 'render'
  | 'compile'
  | 'export'
  | 'import'
  | 'sync';

export type OperationStatus = 'idle' | 'running' | 'success' | 'error';

export interface OperationState {
  type: OperationType;
  status: OperationStatus;
  message: string;
  errorDetail?: string;
  startTime?: number;
  progress?: number; // 0-100，用于真实进度显示
}

// 文件状态
export interface FileStatus {
  isModified: boolean;
  encoding: string;
  lineCount: number;
  cursorPosition: { line: number; column: number };
  selectionCount: number;
}

// 编辑器状态
export interface EditorStatus {
  mode: 'markdown' | 'solarwire';
  zoom: number;
  elementCount: number;
  selectedElementCount: number;
}

// 通知消息
export interface NotificationMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  persistent?: boolean; // 是否持久显示（错误消息）
}

interface StatusState {
  // 当前操作状态
  currentOperation: OperationState | null;
  
  // 文件信息
  filePath: string;
  fileStatus: FileStatus;
  
  // 编辑器状态
  editorStatus: EditorStatus;
  
  // 通知消息队列
  notifications: NotificationMessage[];
  
  // 系统状态
  isOnline: boolean;
  memoryUsage?: number;
  
  // Actions
  setCurrentFilePath: (path: string) => void;
  updateFileStatus: (status: Partial<FileStatus>) => void;
  updateEditorStatus: (status: Partial<EditorStatus>) => void;
  
  startOperation: (type: OperationType, message?: string) => void;
  updateOperationProgress: (progress: number) => void;
  completeOperation: (message?: string) => void;
  failOperation: (message: string, errorDetail?: string) => void;
  clearOperation: () => void;
  
  addNotification: (type: NotificationMessage['type'], message: string, persistent?: boolean) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  setOnlineStatus: (isOnline: boolean) => void;
  updateMemoryUsage: (usage: number) => void;
}

const operationIcons: Record<OperationType, string> = {
  'save': '💾',
  'open': '📂',
  'load': '🔄',
  'version': '📋',
  'parse': '🔍',
  'render': '🎨',
  'compile': '⚙️',
  'export': '📤',
  'import': '📥',
  'sync': '🔄',
};

const notificationIcons: Record<NotificationMessage['type'], string> = {
  'info': 'ℹ️',
  'success': '✅',
  'warning': '⚠️',
  'error': '❌',
};

export const useStatusStore = create<StatusState>((set, get) => ({
  currentOperation: null,
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
  notifications: [],
  isOnline: true,

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

  startOperation: (type: OperationType, message?: string) => {
    set({
      currentOperation: {
        type,
        status: 'running',
        message: message || '处理中...',
        startTime: Date.now(),
        progress: 0,
      },
    });
  },

  updateOperationProgress: (progress: number) => {
    set((state) => ({
      currentOperation: state.currentOperation
        ? { ...state.currentOperation, progress }
        : null,
    }));
  },

  completeOperation: (message?: string) => {
    set((state) => ({
      currentOperation: state.currentOperation
        ? {
            ...state.currentOperation,
            status: 'success',
            message: message || '完成',
            progress: 100,
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

  addNotification: (type: NotificationMessage['type'], message: string, persistent = false) => {
    const id = Date.now().toString();
    const notification: NotificationMessage = {
      id,
      type,
      message,
      timestamp: Date.now(),
      persistent,
    };
    
    set((state) => ({
      notifications: [...state.notifications, notification],
    }));
    
    // 非持久消息自动移除
    if (!persistent && type !== 'error') {
      setTimeout(() => {
        get().removeNotification(id);
      }, 5000);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
    if (!isOnline) {
      get().addNotification('warning', '网络连接已断开', true);
    } else {
      get().addNotification('success', '网络连接已恢复');
    }
  },

  updateMemoryUsage: (usage: number) => {
    set({ memoryUsage: usage });
  },
}));

// Helper functions
export function getOperationIcon(type: OperationType): string {
  return operationIcons[type];
}

export function getNotificationIcon(type: NotificationMessage['type']): string {
  return notificationIcons[type];
}

// 统一的状态通知接口 - 替代原有的 toast 系统
export function showStatusMessage(
  type: NotificationMessage['type'],
  message: string,
  persistent = false
): void {
  useStatusStore.getState().addNotification(type, message, persistent);
}

// 快捷方法
export const showInfo = (message: string) => showStatusMessage('info', message);
export const showSuccess = (message: string) => showStatusMessage('success', message);
export const showWarning = (message: string) => showStatusMessage('warning', message);
export const showError = (message: string, persistent = true) => showStatusMessage('error', message, persistent);

import { create } from 'zustand';
import type {
  FeedbackType,
  ToastItem,
  NotificationItem,
  OperationType,
  OperationStatus,
  OperationItem,
  ConfirmOptions,
  ConfirmItem,
} from '../../shared/types/feedback';

const MAX_TOASTS = 5;

const DEFAULT_TOAST_DURATIONS: Record<FeedbackType, number> = {
  info: 3000,
  success: 3000,
  warning: 5000,
  error: 0,
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

interface FeedbackState {
  toasts: ToastItem[];
  notifications: NotificationItem[];
  operations: OperationItem[];
  confirmQueue: ConfirmItem[];

  addToast: (type: FeedbackType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;

  addNotification: (type: FeedbackType, message: string, options?: Partial<NotificationItem>) => void;
  removeNotification: (id: string) => void;

  startOperation: (type: OperationType, message: string, options?: { cancellable?: boolean; onCancel?: () => void }) => string;
  updateOperationProgress: (id: string, progress: number) => void;
  completeOperation: (id: string, message?: string) => void;
  failOperation: (id: string, message: string, errorDetail?: string) => void;
  cancelOperation: (id: string) => void;
  removeOperation: (id: string) => void;

  confirm: (options: ConfirmOptions) => Promise<boolean>;
  resolveConfirm: (id: string, confirmed: boolean) => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  toasts: [],
  notifications: [],
  operations: [],
  confirmQueue: [],

  addToast: (type: FeedbackType, message: string, duration?: number) => {
    const actualDuration = duration ?? DEFAULT_TOAST_DURATIONS[type];
    const id = generateId();
    const toast: ToastItem = {
      id,
      type,
      message,
      duration: actualDuration,
      createdAt: Date.now(),
    };

    set((state) => {
      const updated = [...state.toasts, toast];
      if (updated.length > MAX_TOASTS) {
        updated.sort((a, b) => a.createdAt - b.createdAt);
        return { toasts: updated.slice(updated.length - MAX_TOASTS) };
      }
      return { toasts: updated };
    });

    if (actualDuration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, actualDuration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  addNotification: (type: FeedbackType, message: string, options?: Partial<NotificationItem>) => {
    const id = generateId();
    const notification: NotificationItem = {
      id,
      type,
      message,
      persistent: false,
      createdAt: Date.now(),
      ...options,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    if (!notification.persistent && type !== 'error') {
      setTimeout(() => {
        get().removeNotification(id);
      }, 8000);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  startOperation: (type: OperationType, message: string, options?: { cancellable?: boolean; onCancel?: () => void }) => {
    const id = generateId();
    const operation: OperationItem = {
      id,
      type,
      status: 'running' as OperationStatus,
      message,
      progress: 0,
      cancellable: options?.cancellable ?? false,
      onCancel: options?.onCancel,
      createdAt: Date.now(),
    };

    set((state) => ({
      operations: [...state.operations, operation],
    }));

    return id;
  },

  updateOperationProgress: (id: string, progress: number) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, progress } : op
      ),
    }));
  },

  completeOperation: (id: string, message?: string) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id
          ? { ...op, status: 'success' as OperationStatus, progress: 100, message: message ?? op.message }
          : op
      ),
    }));

    setTimeout(() => {
      get().removeOperation(id);
    }, 2000);
  },

  failOperation: (id: string, message: string, errorDetail?: string) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id
          ? { ...op, status: 'error' as OperationStatus, message, errorDetail }
          : op
      ),
    }));
  },

  cancelOperation: (id: string) => {
    const operation = get().operations.find((op) => op.id === id);
    if (operation?.onCancel) {
      operation.onCancel();
    }
    get().removeOperation(id);
  },

  removeOperation: (id: string) => {
    set((state) => ({
      operations: state.operations.filter((op) => op.id !== id),
    }));
  },

  confirm: (options: ConfirmOptions): Promise<boolean> => {
    const id = generateId();
    return new Promise<boolean>((resolve) => {
      const item: ConfirmItem = {
        id,
        options,
        resolve,
      };
      set((state) => ({
        confirmQueue: [...state.confirmQueue, item],
      }));
    });
  },

  resolveConfirm: (id: string, confirmed: boolean) => {
    const item = get().confirmQueue.find((c) => c.id === id);
    if (item) {
      item.resolve(confirmed);
      set((state) => ({
        confirmQueue: state.confirmQueue.filter((c) => c.id !== id),
      }));
    }
  },
}));

export const feedback = {
  toast: {
    info: (msg: string) => useFeedbackStore.getState().addToast('info', msg, 3000),
    success: (msg: string) => useFeedbackStore.getState().addToast('success', msg, 3000),
    warning: (msg: string) => useFeedbackStore.getState().addToast('warning', msg, 5000),
    error: (msg: string) => useFeedbackStore.getState().addToast('error', msg, 0),
  },
  notify: {
    info: (msg: string, opts?: Partial<NotificationItem>) => useFeedbackStore.getState().addNotification('info', msg, opts),
    success: (msg: string, opts?: Partial<NotificationItem>) => useFeedbackStore.getState().addNotification('success', msg, opts),
    warning: (msg: string, opts?: Partial<NotificationItem>) => useFeedbackStore.getState().addNotification('warning', msg, { persistent: true, ...opts }),
    error: (msg: string, opts?: Partial<NotificationItem>) => useFeedbackStore.getState().addNotification('error', msg, { persistent: true, ...opts }),
  },
  operation: {
    start: (type: OperationType, msg: string, opts?: { cancellable?: boolean; onCancel?: () => void }) => useFeedbackStore.getState().startOperation(type, msg, opts),
    updateProgress: (id: string, progress: number) => useFeedbackStore.getState().updateOperationProgress(id, progress),
    complete: (id: string, msg?: string) => useFeedbackStore.getState().completeOperation(id, msg),
    fail: (id: string, msg: string, detail?: string) => useFeedbackStore.getState().failOperation(id, msg, detail),
    removeOperation: (id: string) => useFeedbackStore.getState().removeOperation(id),
  },
  confirm: (options: ConfirmOptions) => useFeedbackStore.getState().confirm(options),
};

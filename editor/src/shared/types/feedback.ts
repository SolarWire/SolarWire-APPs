export type FeedbackType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: FeedbackType;
  message: string;
  duration: number;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  persistent: boolean;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

export type OperationType = 'save' | 'open' | 'load' | 'export' | 'import' | 'refresh' | 'compile' | 'render' | 'parse';
export type OperationStatus = 'running' | 'success' | 'error';

export interface OperationItem {
  id: string;
  type: OperationType;
  status: OperationStatus;
  message: string;
  progress: number;
  errorDetail?: string;
  cancellable: boolean;
  onCancel?: () => void;
  createdAt: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmItem {
  id: string;
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'parser' | 'diagnostic';
}

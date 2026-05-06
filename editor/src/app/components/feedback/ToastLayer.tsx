import React from 'react';
import { useFeedbackStore } from '../../stores/feedbackStore';
import type { ToastItem } from '../../../shared/types/feedback';
import './ToastLayer.css';

const TOAST_ICONS: Record<ToastItem['type'], string> = {
  info: '\u2139\uFE0F',
  success: '\u2705',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
};

const ToastLayer: React.FC = () => {
  const toasts = useFeedbackStore((state) => state.toasts);
  const removeToast = useFeedbackStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-layer">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          <span className="toast-icon">{TOAST_ICONS[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastLayer;

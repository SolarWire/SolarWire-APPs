import React, { useState, useEffect } from 'react';
import { showToast, removeToast, subscribeToasts } from '../../services/toast-service';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          {toast.type === 'error' && (
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export { showToast };

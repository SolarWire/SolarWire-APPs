import React, { useEffect, useCallback } from 'react';
import { useFeedbackStore } from '../../stores/feedbackStore';
import './ConfirmDialog.css';

function ConfirmDialog(): React.ReactElement | null {
  const confirmQueue = useFeedbackStore((state) => state.confirmQueue);
  const resolveConfirm = useFeedbackStore((state) => state.resolveConfirm);

  const item = confirmQueue[0];

  const handleDismiss = useCallback(() => {
    if (item) {
      resolveConfirm(item.id, false);
    }
  }, [item, resolveConfirm]);

  const handleConfirm = useCallback(() => {
    if (item) {
      resolveConfirm(item.id, true);
    }
  }, [item, resolveConfirm]);

  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resolveConfirm(item.id, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, resolveConfirm]);

  if (!item) return null;

  const { title, message, type, confirmText, cancelText } = item.options;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      resolveConfirm(item.id, false);
    }
  };

  return (
    <div className="confirm-overlay" onClick={handleOverlayClick}>
      <div className={`confirm-dialog confirm-dialog-${type}`}>
        <div className="confirm-header">
          <h3>{title}</h3>
          <button className="confirm-close-btn" onClick={handleDismiss}>
            ✕
          </button>
        </div>

        <div className="confirm-body">
          <p>{message}</p>
        </div>

        <div className="confirm-footer">
          <button className="confirm-cancel-btn" onClick={handleDismiss}>
            {cancelText || '取消'}
          </button>
          <button className="confirm-action-btn" onClick={handleConfirm}>
            {confirmText || '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

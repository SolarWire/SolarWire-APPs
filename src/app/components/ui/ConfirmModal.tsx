import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps): React.ReactElement | null {
  const t = useTranslation();

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className={`confirm-modal confirm-modal-${type}`}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
          <button className="confirm-close-button" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button className="confirm-cancel-button" onClick={onCancel}>
            {cancelText || t.common.cancel}
          </button>
          <button 
            className={`confirm-confirm-button confirm-confirm-button-${type}`} 
            onClick={handleConfirm}
          >
            {confirmText || t.common.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

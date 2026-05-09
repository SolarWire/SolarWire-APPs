import React, { useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import ModalPortal from './ModalPortal';
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

  // ESC键关闭模态窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

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
    <ModalPortal><div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className={`confirm-modal confirm-modal-${type} glass-panel`}>
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
    </div></ModalPortal>
  );
}

export default ConfirmModal;

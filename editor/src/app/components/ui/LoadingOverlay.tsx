import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  visible: boolean;
  icon: string;
  text: string;
  progress: number;
  showCancel?: boolean;
  onCancel?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  icon, 
  text, 
  progress,
  showCancel = false,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="loading-overlay-icon">{icon}</div>
        <div className="loading-overlay-text">{text}</div>
        <div className="loading-overlay-progress-bar">
          <div
            className="loading-overlay-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        {showCancel && onCancel && (
          <button 
            className="loading-overlay-cancel-btn"
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;

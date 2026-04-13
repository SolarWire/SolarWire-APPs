import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

/**
 * 通用加载指示器组件
 * @param size - 尺寸: small(16px), medium(24px), large(32px)
 * @param text - 可选的加载文本
 * @param overlay - 是否显示遮罩层
 */
export default function LoadingSpinner({
  size = 'medium',
  text,
  overlay = false,
}: LoadingSpinnerProps): JSX.Element {
  const spinnerClass = `loading-spinner loading-spinner--${size}`;

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div 
          className={spinnerClass}
          role="status"
          aria-label={text || 'Loading'}
        >
          <div className="loading-spinner__circle"></div>
        </div>
        {text && <span className="loading-overlay__text">{text}</span>}
      </div>
    );
  }

  return (
    <div 
      className={spinnerClass}
      role="status"
      aria-label={text || 'Loading'}
    >
      <div className="loading-spinner__circle"></div>
      {text && <span className="loading-spinner__text">{text}</span>}
    </div>
  );
}

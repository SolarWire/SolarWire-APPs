import React from 'react';
import './ErrorCard.css';

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'parser' | 'diagnostic';
}

interface ErrorCardProps {
  error: SyntaxError;
  onViewInCode: (line: number, column: number) => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, onViewInCode }) => {
  const handleViewInCode = () => {
    onViewInCode(error.line, error.column);
  };

  return (
    <div className={`error-card ${error.severity}`}>
      <div className="error-card-header">
        <div className="error-card-icon">
          {error.severity === 'error' ? '❌' : '⚠️'}
        </div>
        <div className="error-card-info">
          <div className="error-card-location">
            行 {error.line}, 列 {error.column}
          </div>
          <div className="error-card-summary">
            {error.message.length > 50 
              ? error.message.substring(0, 50) + '...' 
              : error.message
            }
          </div>
        </div>
        <div className="error-card-actions">
          <button 
            className="error-card-view-btn"
            onClick={handleViewInCode}
            title="跳转到代码修复错误"
          >
            👁️ 去修复
          </button>
        </div>
      </div>
      
      <div className="error-card-details">
        <div className="error-card-message">
          {error.message}
        </div>
        <div className="error-card-meta">
          <span className="error-card-source">
            来源: {error.source === 'parser' ? '解析器' : '诊断'}
          </span>
          <span className="error-card-severity">
            严重程度: {error.severity === 'error' ? '错误' : '警告'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ErrorCard;

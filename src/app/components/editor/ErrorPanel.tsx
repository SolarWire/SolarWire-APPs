import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import './ErrorPanel.css';

interface ErrorInfo {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

interface ErrorPanelProps {
  errors: ErrorInfo[];
  onJumpToError: (line: number, column: number) => void;
}

const ErrorPanel: React.FC<ErrorPanelProps> = ({ errors, onJumpToError }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = errors.length;
  const errorOnlyCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  if (errorCount === 0) {
    return null;
  }

  return (
    <div className={`error-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="error-panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="error-panel-title">
          <span className="error-count error">{errorOnlyCount}</span>
          {warningCount > 0 && (
            <span className="error-count warning">{warningCount}</span>
          )}
          <span className="error-panel-text">语法错误</span>
        </div>
        <div className="error-panel-toggle">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="error-panel-content">
          {errors.map((error, index) => (
            <div 
              key={index}
              className={`error-item ${error.severity}`}
              onClick={() => onJumpToError(error.line, error.column)}
            >
              <div className="error-item-header">
                <span className="error-line">行 {error.line}</span>
                <span className="error-severity">
                  {error.severity === 'error' ? '❌' : '⚠️'}
                </span>
              </div>
              <div className="error-message">{error.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorPanel;

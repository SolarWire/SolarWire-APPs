/**
 * 状态栏组件
 */

import React from 'react';
import { useStatusStore, getOperationIcon } from '../../stores/statusStore';
import './StatusBar.css';

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 50 50">
      <circle
        className="spinner-circle"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="5"
      />
    </svg>
  );
}

function OperationStatusDisplay() {
  const { currentOperation } = useStatusStore();

  if (!currentOperation) return null;

  const { type, status, message, errorDetail } = currentOperation;
  const icon = getOperationIcon(type);

  if (status === 'running') {
    return (
      <div className="status-bar-item operation-status running">
        <Spinner />
        <span className="progress-bar-container">
          <span className="progress-bar-virtual"></span>
        </span>
        <span className="operation-message">{message}</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="status-bar-item operation-status success">
        <span className="status-icon">✅</span>
        <span className="operation-message">{message}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="status-bar-item operation-status error">
        <span className="status-icon">❌</span>
        <span 
          className="operation-message error-message" 
          title={errorDetail || message}
        >
          {message}
        </span>
      </div>
    );
  }

  return null;
}

function FilePathDisplay() {
  const { filePath } = useStatusStore();

  if (!filePath) {
    return (
      <div className="status-bar-item file-path">
        <span className="no-file-text">No file opened</span>
      </div>
    );
  }

  return (
    <div className="status-bar-item file-path" title={filePath} data-full-path={filePath}>
      <span className="file-icon">📁</span>
      <span className="file-path-text">{filePath}</span>
    </div>
  );
}

export function StatusBar(): React.ReactElement {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <FilePathDisplay />
      </div>
      <div className="status-bar-right">
        <OperationStatusDisplay />
      </div>
    </div>
  );
}

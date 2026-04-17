/**
 * 状态栏组件
 */

import React from 'react';
import { useGitStore } from '../../stores/gitStore';
import './StatusBar.css';

export function StatusBar(): JSX.Element {
  const { gitAnalysis } = useGitStore();

  return (
    <div className="status-bar">
      {/* Git 分析进度 */}
      {gitAnalysis && gitAnalysis.status === 'running' && (
        <div className="status-bar-item git-analysis">
          <Spinner className="spinner" />
          <span className="progress-text">
            Git 分析中：{gitAnalysis.processed}/{gitAnalysis.total} 个提交
          </span>
          <button 
            onClick={gitAnalysis.onCancel}
            className="cancel-button"
          >
            取消
          </button>
        </div>
      )}
      
      {/* Git 分析完成 */}
      {gitAnalysis && gitAnalysis.status === 'completed' && (
        <div className="status-bar-item git-analysis">
          <CheckIcon className="success-icon" />
          <span>
            ✓ 找到 {gitAnalysis.matchingCommits} 个相关版本
          </span>
        </div>
      )}

      {/* 其他状态栏内容 */}
      <div className="status-bar-item">
        {/* ... */}
      </div>
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`spinner ${className}`} viewBox="0 0 24 24">
      <circle
        className="spinner-circle"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={`success-icon ${className}`} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    </svg>
  );
}

export default StatusBar;

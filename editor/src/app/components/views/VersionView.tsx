/**
 * VersionView 组件 - 重构版本
 * 支持错误提示、进度显示、智能分析、提交详情查看
 * 使用 @tomplum/react-git-log 显示提交历史
 */
import React, { useState } from 'react';
import { Scrollbar } from '../ui/Scrollbar';
import { useVersionHistory } from '../../../shared/hooks/useVersionHistory';
import { CommitDetail } from './CommitDetail';
import { GitLogView } from './GitLogView';
import './VersionView.css';

interface VersionViewProps {
  /**
   * 文件路径
   */
  filePath?: string;
  
  /**
   * SolarWire 代码块信息（如果是 MD 文件中的代码块）
   */
  snippet?: {
    code: string;
    snippetIndex: number;
  };
}

/**
 * VersionView 组件
 */
export function VersionView({ filePath, snippet }: VersionViewProps): JSX.Element {
  const {
    analysisProgress,
    matchingCommits,
    error,
    suggestion,
    cancelAnalysis,
    isLoading
  } = useVersionHistory(filePath || '', snippet);
  
  const [selectedCommit, setSelectedCommit] = useState<any | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState<any | null>(null);
  const [compareTo, setCompareTo] = useState<any | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  // 错误状态
  if (error) {
    return (
      <Scrollbar className="version-view-scrollbar">
        <div className="version-view">
          <div className="version-error">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            {suggestion && (
              <div className="suggestion">
                💡 {suggestion}
              </div>
            )}
          </div>
        </div>
      </Scrollbar>
    );
  }

  // 分析中状态
  if (analysisProgress?.status === 'running') {
    return (
      <Scrollbar className="version-view-scrollbar">
        <div className="version-view">
          <div className="version-loading">
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${(analysisProgress.processed / analysisProgress.total) * 100}%` 
                }} 
              />
            </div>
            <div className="progress-text">
              正在分析 {analysisProgress.processed}/{analysisProgress.total} 个提交...
            </div>
            <button onClick={cancelAnalysis} className="cancel-button">
              取消
            </button>
          </div>
        </div>
      </Scrollbar>
    );
  }

  // 空结果状态
  if (matchingCommits.length === 0) {
    return (
      <Scrollbar className="version-view-scrollbar">
        <div className="version-view">
          <div className="version-empty">
            <div className="empty-icon">📭</div>
            <div className="empty-text">
              未找到相关版本历史记录
            </div>
            <div className="empty-subtext">
              {snippet 
                ? `暂时没有找到该代码块的修改记录`
                : `暂时没有找到该文件的修改记录`}
            </div>
            <div className="empty-tips">
              <p>💡 如何查看版本历史？</p>
              <ul>
                <li><strong>添加 !title 标识：</strong>在代码块第一行添加 <code>!title=描述</code></li>
                <li>确保 Git 仓库有提交历史</li>
                <li>修改代码块并提交后再次查看</li>
              </ul>
            </div>
            <div className="empty-actions">
              <button 
                className="empty-action-btn"
                onClick={() => window.open('https://git-scm.com/docs/git-log', '_blank')}
              >
                查看 Git 文档
              </button>
              <button 
                className="empty-action-btn secondary"
                onClick={() => {
                  // 可以添加刷新或重新分析的功能
                  window.location.reload();
                }}
              >
                重新分析
              </button>
            </div>
          </div>
        </div>
      </Scrollbar>
    );
  }

  // 对比模式：显示 DiffView
  if (compareMode && compareFrom && compareTo && showDiff) {
    return (
      <DiffView
        filePath={filePath}
        oldCommit={compareFrom.hash}
        newCommit={compareTo.hash}
        onClose={() => {
          setCompareMode(false);
          setCompareFrom(null);
          setCompareTo(null);
          setShowDiff(false);
        }}
      />
    );
  }
  
  // 正常显示提交列表
  if (selectedCommit) {
    return (
      <CommitDetail
        commit={selectedCommit}
        onClose={() => setSelectedCommit(null)}
        currentFilePath={filePath}
        showCheckout={true}
      />
    );
  }
  
  return (
    <Scrollbar className="version-view-scrollbar">
      <div className="version-view">
        <div className="version-header">
          <span className="version-title">
            ✓ 找到 {matchingCommits.length} 个相关版本
          </span>
          <div className="version-actions">
            {compareMode ? (
              <button 
                className="cancel-compare-btn"
                onClick={() => {
                  setCompareMode(false);
                  setCompareFrom(null);
                  setCompareTo(null);
                }}
              >
                取消对比
              </button>
            ) : (
              <button 
                className="compare-mode-btn"
                onClick={() => setCompareMode(true)}
              >
                对比版本
              </button>
            )}
          </div>
          {snippet && (
            <span className="snippet-info">
              代码块 #{snippet.snippetIndex}
            </span>
          )}
        </div>
        
        {compareMode && (
          <div className="compare-info">
            <span className="compare-label">选择两个版本进行对比：</span>
            <span className={`compare-status ${compareFrom ? 'selected' : ''}`}>
              {compareFrom ? `已选：${compareFrom.shortHash}` : '请选择第一个版本'}
            </span>
            <span className="compare-arrow">→</span>
            <span className={`compare-status ${compareTo ? 'selected' : ''}`}>
              {compareTo ? `已选：${compareTo.shortHash}` : '请选择第二个版本'}
            </span>
            {compareFrom && compareTo && (
              <button 
                className="show-diff-btn"
                onClick={() => setShowDiff(true)}
              >
                显示差异
              </button>
            )}
          </div>
        )}
        
        <div className="git-log-container">
          <GitLogView
            commits={matchingCommits}
            currentBranch="HEAD"
            onSelectCommit={(commit) => {
              if (compareMode) {
                if (!compareFrom) {
                  setCompareFrom(commit);
                } else if (!compareTo && compareFrom.hash !== commit.hash) {
                  setCompareTo(commit);
                }
              } else {
                setSelectedCommit(commit);
              }
            }}
          />
        </div>
      </div>
    </Scrollbar>
  );
}

/**
 * 提交项组件
 */
function CommitItem({ 
  commit, 
  compareMode,
  isSelected,
  onSelectForCompare,
  onViewDetails 
}: { 
  commit: any; 
  compareMode?: boolean;
  isSelected?: boolean;
  onSelectForCompare?: () => void;
  onViewDetails?: () => void;
}): JSX.Element {
  if (compareMode) {
    return (
      <div 
        className={`commit-item ${isSelected ? 'selected' : ''} compare-item`}
        onClick={onSelectForCompare}
      >
        <div className="commit-header">
          <span className="commit-hash">{commit.shortHash}</span>
          <span className="commit-date">
            {new Date(commit.date).toLocaleString()}
          </span>
          {isSelected && <span className="selected-badge">✓</span>}
        </div>
        <div className="commit-message">{commit.message}</div>
      </div>
    );
  }
  
  return (
    <div className="commit-item" onClick={onViewDetails}>
      <div className="commit-header">
        <span className="commit-hash">{commit.shortHash}</span>
        <span className="commit-date">
          {new Date(commit.date).toLocaleString()}
        </span>
      </div>
      <div className="commit-message">{commit.message}</div>
      <div className="commit-author">
        <span className="author-label">Author:</span>
        <span className="author-name">{commit.authorName}</span>
      </div>
      {onViewDetails && (
        <div className="commit-actions">
          <button 
            className="view-details-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            详情
          </button>
        </div>
      )}
    </div>
  );
}

export default VersionView;

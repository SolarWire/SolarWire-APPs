import React, { useState } from 'react';
import { useGitStore } from '../../stores/gitStore';
import { GitGraph } from '../version/GitGraph';
import { Scrollbar } from '../ui/Scrollbar';
import './GitView.css';

function GitView(): React.ReactElement {
  const { isInitialized, status, commit, stageAllModified, refreshStatus, history, refreshHistory } = useGitStore();
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleRefresh = async () => {
    try {
      await refreshStatus();
      await refreshHistory();
    } catch (error) {
      console.error('Failed to refresh Git status:', error);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    setIsCommitting(true);
    try {
      // 先暂存所有文件
      await stageAllModified();
      
      // 再提交
      await commit(commitMessage);
      setCommitMessage('');
    } catch (error) {
      console.error('Commit failed:', error);
    } finally {
      setIsCommitting(false);
    }
  };

  const hasChanges = status.modified.length > 0 || status.untracked.length > 0 || status.staged.length > 0;

  if (!isInitialized) {
    return (
      <div className="git-view">
        <div className="git-empty">Open a folder first to use Git</div>
      </div>
    );
  }

  return (
    <Scrollbar className="git-view-scrollbar">
      <div className="git-view">
        <div className="git-header">
          <button className="refresh-button" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>

        {/* 始终显示 Commit 区域 */}
        <div className="commit-section">
          <div className="section-title">Commit</div>
          <textarea
            className="commit-message-input"
            placeholder="输入提交信息..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            rows={3}
          />
          <button
            className="commit-button"
            onClick={handleCommit}
            disabled={!commitMessage.trim() || isCommitting}
          >
            {isCommitting ? '提交中...' : '提交'}
          </button>
        </div>

        {status.modified.length > 0 && (
          <div className="git-section">
            <div className="section-title modified">Modified ({status.modified.length})</div>
            {status.modified.map((file) => (
              <div key={file} className="file-item">
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        )}

        {status.staged.length > 0 && (
          <div className="git-section">
            <div className="section-title staged">Staged ({status.staged.length})</div>
            {status.staged.map((file) => (
              <div key={file} className="file-item">
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        )}

        {status.untracked.length > 0 && (
          <div className="git-section">
            <div className="section-title untracked">Untracked Files ({status.untracked.length})</div>
            {status.untracked.map((file) => (
              <div key={file} className="file-item">
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        )}

        {/* Git 历史可视化 */}
        {history.length > 0 && (
          <div className="git-log-section">
            <div className="section-title">History ({history.length})</div>
            <div className="git-log-container">
              <GitGraph
                commits={history}
                currentBranch="main"
              />
            </div>
          </div>
        )}
      </div>
    </Scrollbar>
  );
}

export default GitView;

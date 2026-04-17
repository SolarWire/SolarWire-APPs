import React, { useState } from 'react';
import { useGitStore } from '../../stores/gitStore';
import { Scrollbar } from '../ui/Scrollbar';
import './GitView.css';

function GitView(): JSX.Element {
  const { isInitialized, status, commit, stageAllModified, refreshStatus } = useGitStore();
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleRefresh = async () => {
    try {
      await refreshStatus();
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
          <h3>Git</h3>
          <button className="refresh-button" onClick={handleRefresh}>
            🔄 Refresh
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
      </div>
    </Scrollbar>
  );
}

export default GitView;

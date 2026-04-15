import React, { useState } from 'react';
import { useGitStore } from '../../stores/gitStore';
import './GitView.css';

function GitView(): JSX.Element {
  const { isInitialized, status, commit, stageAllModified, error, clearError } = useGitStore();
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    setIsCommitting(true);
    try {
      // 先暂存所有文件
      await stageAllModified();
      
      // 再提交
      await commit(commitMessage);
      setCommitMessage('');
    } catch (err) {
      // Error already set in store, no need to handle here
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRetry = async () => {
    if (!error) return;
    clearError();
    // Retry the last failed operation by re-triggering commit if there's a message
    if (commitMessage.trim()) {
      handleCommit();
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
    <div className="git-view">
      {error && (
        <div className="git-error-banner" role="alert" aria-label="Git error">
          <div className="git-error-banner__content">
            <span className="git-error-banner__icon" role="img" aria-label="warning">⚠️</span>
            <span className="git-error-banner__message">{error}</span>
          </div>
          <div className="git-error-banner__actions">
            <button onClick={handleRetry} disabled={isCommitting} aria-label="Retry operation">Retry</button>
            <button onClick={clearError} aria-label="Dismiss error">Dismiss</button>
          </div>
        </div>
      )}

      <div className="git-section">
        <div className="section-title">Commit</div>
        
        <div className="git-section">
          <div className="section-title">Commit Message</div>
          <textarea
            data-testid="commit-message-input"
            className="commit-message"
            placeholder="Enter commit message..."
            aria-label="Commit message"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            rows={3}
          />
        </div>

        <button 
          data-testid="stage-all-btn"
          className="action-button" 
          onClick={stageAllModified}
          disabled={!hasChanges || isCommitting}
          aria-label="Stage all changes"
        >
          Stage All
        </button>

        <button 
          data-testid="commit-btn"
          className="action-button" 
          onClick={handleCommit}
          disabled={!commitMessage.trim() || !hasChanges || isCommitting}
          aria-label="Commit changes"
        >
          {isCommitting ? 'Committing...' : 'Commit'}
        </button>

        <div className="git-section">
          <div className="section-title">Staged Files ({status.staged.length})</div>
          {status.staged.length === 0 ? (
            <div className="empty-section">No staged files</div>
          ) : (
            status.staged.map((file) => (
              <div key={file} className="file-item">
                <span className="file-name">{file}</span>
              </div>
            ))
          )}
        </div>

        <div className="git-section">
          <div className="section-title">Modified Files ({status.modified.length})</div>
          {status.modified.length === 0 ? (
            <div className="empty-section">No modified files</div>
          ) : (
            status.modified.map((file) => (
              <div key={file} className="file-item">
                <span className="file-name">{file}</span>
              </div>
            ))
          )}
        </div>

        {status.untracked.length > 0 && (
          <div className="git-section">
            <div className="section-title">Untracked Files ({status.untracked.length})</div>
            {status.untracked.map((file) => (
              <div key={file} className="file-item">
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GitView;

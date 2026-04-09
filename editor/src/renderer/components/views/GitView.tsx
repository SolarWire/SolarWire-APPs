import React, { useState } from 'react';
import { useGitStore } from '../../stores/gitStore';
import './GitView.css';

function GitView(): JSX.Element {
  const { isInitialized, status, commit, stageAllModified } = useGitStore();
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
    <div className="git-view">
      <div className="git-section">
        <div className="section-title">Commit</div>
        
        <div className="git-section">
          <div className="section-title">Commit Message</div>
          <textarea
            className="commit-message"
            placeholder="Enter commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            rows={3}
          />
        </div>

        <button 
          className="action-button" 
          onClick={handleCommit}
          disabled={!commitMessage.trim() || !hasChanges || isCommitting}
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

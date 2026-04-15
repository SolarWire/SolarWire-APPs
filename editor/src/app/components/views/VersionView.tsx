import React, { useState, useEffect } from 'react';
import { useGitStore } from '../../stores/gitStore';
import { useFileStore } from '../../stores/fileStore';
import './VersionView.css';

function VersionView(): JSX.Element {
  const { 
    isInitialized, 
    history, 
    refreshHistory, 
    selectCommit, 
    selectedCommit, 
    checkoutCommit,
    isDiffMode,
    enterDiffMode,
    setLeftCommit
  } = useGitStore();
  const { selectedFile, currentPath } = useFileStore();
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isInitialized) {
      const relativePath = selectedFile && currentPath 
        ? selectedFile.path.replace(currentPath, '').replace(/^[/\\]/, '')
        : undefined;
      refreshHistory(relativePath);
    }
  }, [isInitialized, refreshHistory, selectedFile, currentPath]);

  const filteredHistory = history.filter((commit) =>
    commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commit.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commit.shortHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCommitClick = (commit: any) => {
    if (selectedCommit?.hash === commit.hash) {
      selectCommit(null);
    } else {
      selectCommit(commit);
    }
  };

  const handleCheckout = async (commit: any) => {
    if (confirm(`Check out commit ${commit.shortHash}? This will put you in a detached HEAD state.`)) {
      await checkoutCommit(commit.hash);
    }
  };

  const handleCompare = (commit: any) => {
    setLeftCommit(commit);
    enterDiffMode();
  };

  if (!isInitialized) {
    return (
      <div className="version-view">
        <div className="version-empty">Open a folder first to see version history</div>
      </div>
    );
  }

  return (
    <div className="version-view">
      <input
        type="text"
        className="search-input"
        placeholder="Search commits..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {selectedFile && (
        <div className="selected-file-info">
          <span className="info-label">History for:</span>
          <span className="file-name">{selectedFile.name}</span>
        </div>
      )}
      
      <div className="commit-list">
        {filteredHistory.length === 0 ? (
          <div className="version-empty">
            {selectedFile ? 'No commits found for this file' : 'No commits found'}
          </div>
        ) : (
          filteredHistory.map((commit) => (
            <div
              key={commit.hash}
              className={`commit-item ${selectedCommit?.hash === commit.hash ? 'selected' : ''}`}
              onClick={() => handleCommitClick(commit)}
            >
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
              {selectedFile && (
                <div className="commit-actions">
                  <button
                    className="compare-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompare(commit);
                    }}
                  >
                    Compare
                  </button>
                  <button
                    className="checkout-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(commit);
                    }}
                  >
                    Checkout
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VersionView;

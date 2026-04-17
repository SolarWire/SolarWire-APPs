import React, { useState, useMemo } from 'react';
import { useGitStore } from '../../stores/gitStore';
import { useGitDiffStore } from '../../stores/gitDiffStore';
import { useFileStore } from '../../stores/fileStore';
import './VersionDiffMode.css';

interface DiffStatus {
  type: 'same' | 'added' | 'removed' | 'modified';
}

function VersionDiffMode(): React.ReactElement {
  const { history } = useGitStore();
  const { 
    leftCommit, 
    rightCommit, 
    leftFileContent, 
    rightFileContent,
    setLeftCommit, 
    setRightCommit, 
    loadLeftFileContent, 
    loadRightFileContent, 
    loadFileDiff,
    exitDiffMode 
  } = useGitDiffStore();
  const { selectedFile, currentPath } = useFileStore();

  const [leftCommitSearch, setLeftCommitSearch] = useState('');
  const [rightCommitSearch, setRightCommitSearch] = useState('');

  const filteredLeftHistory = history.filter((commit) =>
    commit.message.toLowerCase().includes(leftCommitSearch.toLowerCase()) ||
    commit.shortHash.toLowerCase().includes(leftCommitSearch.toLowerCase())
  );

  const filteredRightHistory = history.filter((commit) =>
    commit.message.toLowerCase().includes(rightCommitSearch.toLowerCase()) ||
    commit.shortHash.toLowerCase().includes(rightCommitSearch.toLowerCase())
  );

  const relativePath = selectedFile && currentPath 
    ? selectedFile.path.replace(currentPath, '').replace(/^[/\\]/, '')
    : undefined;

  const handleLeftCommitSelect = async (commit: any) => {
    setLeftCommit(commit);
    if (relativePath) {
      await loadLeftFileContent(relativePath, commit.hash);
      if (rightCommit) {
        await loadFileDiff(relativePath, commit.hash, rightCommit.hash);
      }
    }
  };

  const handleRightCommitSelect = async (commit: any) => {
    setRightCommit(commit);
    if (relativePath) {
      await loadRightFileContent(relativePath, commit.hash);
      if (leftCommit) {
        await loadFileDiff(relativePath, leftCommit.hash, commit.hash);
      }
    }
  };

  const { leftDiffStatus, rightDiffStatus } = useMemo(() => {
    const leftLines = leftFileContent ? leftFileContent.split('\n') : [];
    const rightLines = rightFileContent ? rightFileContent.split('\n') : [];
    const leftStatus: DiffStatus[] = [];
    const rightStatus: DiffStatus[] = [];

    const maxLines = Math.max(leftLines.length, rightLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const leftLine = leftLines[i];
      const rightLine = rightLines[i];

      if (leftLine !== undefined && rightLine !== undefined) {
        if (leftLine === rightLine) {
          leftStatus.push({ type: 'same' });
          rightStatus.push({ type: 'same' });
        } else {
          leftStatus.push({ type: 'removed' });
          rightStatus.push({ type: 'added' });
        }
      } else if (leftLine !== undefined) {
        leftStatus.push({ type: 'removed' });
      } else if (rightLine !== undefined) {
        rightStatus.push({ type: 'added' });
      }
    }

    return { leftDiffStatus: leftStatus, rightDiffStatus: rightStatus };
  }, [leftFileContent, rightFileContent]);

  const renderFileContent = (content: string, diffStatus: DiffStatus[], isLeft: boolean) => {
    const lines = content.split('\n');
    return (
      <div className="file-content-lines">
        {lines.map((line, index) => {
          const status = diffStatus[index] || { type: 'same' };
          let className = 'content-line';
          if (status.type === 'added') className += ' line-added';
          if (status.type === 'removed') className += ' line-removed';
          
          return (
            <div key={index} className={className}>
              <span className="line-number">{index + 1}</span>
              <span className="line-text">{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="version-diff-mode">
      <div className="diff-header">
        <span className="diff-title">Version Compare</span>
        <button className="close-diff-button" onClick={exitDiffMode}>
          ✕
        </button>
      </div>

      {selectedFile && (
        <div className="selected-file-info">
          <span className="info-label">Comparing:</span>
          <span className="file-name">{selectedFile.name}</span>
        </div>
      )}

      <div className="diff-content">
        {/* Left Panel */}
        <div className="diff-panel">
          <div className="panel-header">
            <span className="panel-title">Version A</span>
          </div>
          <input
            type="text"
            className="commit-search"
            placeholder="Search commits..."
            value={leftCommitSearch}
            onChange={(e) => setLeftCommitSearch(e.target.value)}
          />
          <div className="commit-list-small">
            {filteredLeftHistory.map((commit) => (
              <div
                key={commit.hash}
                className={`commit-item-small ${leftCommit?.hash === commit.hash ? 'selected' : ''}`}
                onClick={() => handleLeftCommitSelect(commit)}
              >
                <div className="commit-hash-small">{commit.shortHash}</div>
                <div className="commit-message-small">{commit.message}</div>
              </div>
            ))}
          </div>
          {leftCommit && leftFileContent && (
            <div className="file-content">
              {renderFileContent(leftFileContent, leftDiffStatus, true)}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="diff-panel">
          <div className="panel-header">
            <span className="panel-title">Version B</span>
          </div>
          <input
            type="text"
            className="commit-search"
            placeholder="Search commits..."
            value={rightCommitSearch}
            onChange={(e) => setRightCommitSearch(e.target.value)}
          />
          <div className="commit-list-small">
            {filteredRightHistory.map((commit) => (
              <div
                key={commit.hash}
                className={`commit-item-small ${rightCommit?.hash === commit.hash ? 'selected' : ''}`}
                onClick={() => handleRightCommitSelect(commit)}
              >
                <div className="commit-hash-small">{commit.shortHash}</div>
                <div className="commit-message-small">{commit.message}</div>
              </div>
            ))}
          </div>
          {rightCommit && rightFileContent && (
            <div className="file-content">
              {renderFileContent(rightFileContent, rightDiffStatus, false)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VersionDiffMode;

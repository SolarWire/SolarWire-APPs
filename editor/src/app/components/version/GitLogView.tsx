import React, { useCallback } from 'react';
import { GitLog, GitLogEntry } from '@tomplum/react-git-log';
import { GitCommit } from '../../../shared/types/git';
import './GitLogView.css';

interface GitLogViewProps {
  commits: GitCommit[];
  currentBranch?: string;
  onSelectCommit?: (commit: GitCommit) => void;
}

function convertToGitLogEntry(commit: GitCommit, branch: string): GitLogEntry {
  return {
    hash: commit.hash,
    branch,
    parents: [],
    message: commit.message,
    author: {
      name: commit.authorName,
      email: commit.authorEmail,
    },
    committerDate: commit.date,
    authorDate: commit.date,
  };
}

export function GitLogView({ commits, currentBranch = 'main', onSelectCommit }: GitLogViewProps): React.ReactElement {
  if (commits.length === 0) {
    return <div className="git-log-empty">暂无提交历史</div>;
  }

  const entries = commits.map((commit) => convertToGitLogEntry(commit, currentBranch));

  const commitMap = new Map(commits.map((c) => [c.hash, c]));

  const CustomRow = useCallback(({ commit, selected, previewed, backgroundColour, ...rowProps }: any) => {
    const handleClick = () => {
      const matchedCommit = commitMap.get(commit.hash);
      if (matchedCommit && onSelectCommit) {
        onSelectCommit(matchedCommit);
      }
    };

    return (
      <div
        {...rowProps}
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          cursor: onSelectCommit ? 'pointer' : 'default',
          backgroundColor: selected ? 'rgba(252, 165, 6, 0.1)' : previewed ? backgroundColour : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          transition: 'background-color 0.15s ease',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666', marginRight: '12px', minWidth: '60px' }}>
          {commit.hash.substring(0, 7)}
        </span>
        <span style={{ flex: 1, fontSize: '13px', color: '#e0e0e0' }}>
          {commit.message}
        </span>
        <span style={{ fontSize: '11px', color: '#888', marginLeft: '12px' }}>
          {commit.author?.name || ''}
        </span>
        <span style={{ fontSize: '11px', color: '#888', marginLeft: '12px', minWidth: '130px', textAlign: 'right' }}>
          {commit.committerDate ? new Date(commit.committerDate).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }) : ''}
        </span>
      </div>
    );
  }, [commitMap, onSelectCommit]);

  return (
    <div className="git-log-view">
      <GitLog entries={entries} currentBranch={currentBranch}>
        <GitLog.Tags />
        <GitLog.GraphHTMLGrid enableResize nodeTheme="plain" showCommitNodeTooltips />
        <GitLog.Table row={CustomRow} />
      </GitLog>
    </div>
  );
}

export default GitLogView;

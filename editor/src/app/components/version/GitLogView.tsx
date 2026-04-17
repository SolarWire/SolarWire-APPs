/**
 * GitLogView 组件 - 使用 @tomplum/react-git-log 显示提交历史
 */
import React from 'react';
import { GitLog } from '@tomplum/react-git-log';
import { GitCommit } from '../../../shared/types/git';
import './GitLogView.css';

interface GitLogViewProps {
  commits: GitCommit[];
  currentBranch?: string;
  onSelectCommit?: (commit: GitCommit) => void;
}

export function GitLogView({ commits, currentBranch = 'main', onSelectCommit }: GitLogViewProps): JSX.Element {
  const entries = commits.map(commit => ({
    hash: commit.hash,
    branch: currentBranch,
    parents: [],
    message: commit.message,
    committerDate: commit.date,
    author: { name: commit.authorName, email: commit.authorEmail || '' },
    authorDate: commit.date
  }));

  return (
    <div className="git-log-view">
      <GitLog entries={entries} currentBranch={currentBranch}>
        <GitLog.Tags />
        <GitLog.GraphHTMLGrid enableResize={true} nodeTheme="plain" showCommitNodeTooltips={true} />
        <GitLog.Table
          timestampFormat="YYYY-MM-DD HH:mm"
          onSelectCommit={({ commit }) => {
            if (onSelectCommit) {
              const originalCommit = commits.find(c => c.hash === commit.hash);
              if (originalCommit) { onSelectCommit(originalCommit); }
            }
          }}
        />
      </GitLog>
    </div>
  );
}

export default GitLogView;

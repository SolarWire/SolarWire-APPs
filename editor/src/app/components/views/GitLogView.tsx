/**
 * GitLogView 组件 - 使用 @tomplum/react-git-log 显示提交历史
 */
import React from 'react';
import { GitLog } from '@tomplum/react-git-log';
import { GitCommit } from '../../shared/types/git';
import './GitLogView.css';

interface GitLogViewProps {
  /**
   * 提交历史列表
   */
  commits: GitCommit[];
  
  /**
   * 当前分支名称
   */
  currentBranch?: string;
  
  /**
   * 点击提交回调
   */
  onSelectCommit?: (commit: GitCommit) => void;
}

/**
 * GitLogView 组件
 */
export function GitLogView({ commits, currentBranch = 'main', onSelectCommit }: GitLogViewProps): JSX.Element {
  // 转换 GitCommit 为 GitLogEntry 格式
  const entries = commits.map(commit => ({
    hash: commit.hash,
    branch: currentBranch,
    parents: [], // 需要在 git-manager 中获取父提交信息
    message: commit.message,
    committerDate: commit.date,
    author: {
      name: commit.authorName,
      email: commit.authorEmail || ''
    },
    authorDate: commit.date
  }));

  return (
    <div className="git-log-view">
      <GitLog entries={entries} currentBranch={currentBranch}>
        <GitLog.Tags />
        <GitLog.GraphHTMLGrid
          enableResize={true}
          nodeTheme="plain"
          showCommitNodeTooltips={true}
        />
        <GitLog.Table
          timestampFormat="YYYY-MM-DD HH:mm"
          onSelectCommit={({ commit }) => {
            if (onSelectCommit) {
              // 找到原始 commit 对象
              const originalCommit = commits.find(c => c.hash === commit.hash);
              if (originalCommit) {
                onSelectCommit(originalCommit);
              }
            }
          }}
        />
      </GitLog>
    </div>
  );
}

export default GitLogView;

import React, { useMemo } from 'react';
import { CommitGraph } from 'commit-graph';
import type { Commit, Branch, GraphStyle } from 'commit-graph';
import { GitCommit, GitBranch } from '../../../shared/types/git';
import './GitLogView.css';

interface GitLogViewProps {
  commits: GitCommit[];
  currentBranch?: string;
  branches?: GitBranch[];
  onSelectCommit?: (commit: GitCommit) => void;
}

function convertToCommitGraphCommit(commit: GitCommit): Commit {
  return {
    sha: commit.hash,
    commit: {
      author: {
        name: commit.authorName,
        date: commit.date,
        email: commit.authorEmail,
      },
      message: commit.message,
    },
    parents: [],
  };
}

const GRAPH_STYLE: GraphStyle = {
  commitSpacing: 36,
  branchSpacing: 20,
  branchColors: [
    '#fca506',
    '#58a6ff',
    '#3fb950',
    '#f778ba',
    '#d2a8ff',
    '#79c0ff',
    '#a5d6ff',
    '#ffa657',
  ],
  nodeRadius: 5,
};

export function GitLogView({ commits, currentBranch = 'main', branches = [], onSelectCommit }: GitLogViewProps): React.ReactElement {
  if (commits.length === 0) {
    return <div className="git-log-empty">暂无提交历史</div>;
  }

  const commitGraphCommits = useMemo(() => commits.map(convertToCommitGraphCommit), [commits]);

  const branchHeads = useMemo<Branch[]>(() => {
    return branches.map((b) => ({
      name: b.name,
      commit: { sha: b.name },
    }));
  }, [branches]);

  const dateFormatFn = useMemo(() => {
    return (d: string | number | Date) => {
      return new Date(d).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };
  }, []);

  const commitMap = useMemo(() => new Map(commits.map((c) => [c.hash, c])), [commits]);

  const handleCommitClick = (commitNode: any) => {
    const commit = commitMap.get(commitNode.hash);
    if (commit && onSelectCommit) {
      onSelectCommit(commit);
    }
  };

  return (
    <div className="git-log-view">
      <CommitGraph
        commits={commitGraphCommits}
        branchHeads={branchHeads}
        currentBranch={currentBranch}
        graphStyle={GRAPH_STYLE}
        dateFormatFn={dateFormatFn}
        onCommitClick={handleCommitClick}
      />
    </div>
  );
}

export default GitLogView;

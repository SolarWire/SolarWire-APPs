/**
 * DiffView 组件 - 使用 @git-diff-view/react 显示文件差异
 */
import React, { useState, useEffect, useMemo } from 'react';
import { DiffView as GitDiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import './DiffView.css';

interface DiffViewProps {
  filePath?: string;
  oldCommit: string;
  newCommit: string;
  onClose?: () => void;
}

interface DiffData {
  oldFile: { fileName: string | null; content: string | null };
  newFile: { fileName: string | null; content: string | null };
  hunks: string[];
}

function parseUnifiedDiff(diffText: string): DiffData {
  const lines = diffText.split(/\r?\n/);
  const hunks: string[] = [];
  let oldFile = '';
  let newFile = '';
  let inHunk = false;
  let currentHunk: string[] = [];

  for (const line of lines) {
    // 解析文件头
    if (line.startsWith('--- a/')) {
      oldFile = line.slice(6);
    } else if (line.startsWith('+++ b/')) {
      newFile = line.slice(6);
    } else if (line.startsWith('@@')) {
      // 新 hunk 开始
      if (currentHunk.length > 0) {
        hunks.push(currentHunk.join('\n'));
      }
      currentHunk = [line];
      inHunk = true;
    } else if (inHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ') || line === '\\ No newline at end of file')) {
      currentHunk.push(line);
    }
  }

  // 保存最后一个 hunk
  if (currentHunk.length > 0) {
    hunks.push(currentHunk.join('\n'));
  }

  return {
    oldFile: { fileName: oldFile || null, content: null },
    newFile: { fileName: newFile || null, content: null },
    hunks,
  };
}

export function DiffView({ filePath, oldCommit, newCommit, onClose }: DiffViewProps): React.ReactElement {
  const [diffText, setDiffText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) return;

    const loadDiff = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = (window as any).api?.git;
        if (!api) {
          setError('Git API 不可用');
          return;
        }

        const diff = await api.getFileDiffBetweenCommits(filePath, oldCommit, newCommit);
        if (diff) {
          setDiffText(diff);
        } else {
          setError('未找到文件差异');
        }
      } catch (err) {
        setError('加载差异失败');
        console.error('Failed to load diff:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDiff();
  }, [filePath, oldCommit, newCommit]);

  const parsedDiff = useMemo(() => {
    if (!diffText) return null;
    return parseUnifiedDiff(diffText);
  }, [diffText]);

  if (loading) {
    return (
      <div className="diff-view">
        <div className="diff-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diff-view">
        <div className="diff-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="diff-view">
      {onClose && (
        <div className="diff-header">
          <span className="diff-file">{filePath}</span>
          <button className="diff-close" onClick={onClose}>✕</button>
        </div>
      )}
      {parsedDiff && parsedDiff.hunks.length > 0 ? (
        <GitDiffView
          data={parsedDiff}
          diffViewMode={DiffModeEnum.Split}
          diffViewTheme="dark"
          diffViewHighlight={true}
          diffViewWrap={true}
        />
      ) : (
        <div className="diff-empty">无差异</div>
      )}
    </div>
  );
}

export default DiffView;
